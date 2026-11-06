package studio.karanparmar.flow

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * Holds the microphone. Android only lets an app record while it is in the background
 * from a foreground service that was started while the app was on screen, so the
 * Studio Flow screen starts this service and it keeps a small "ready" notification.
 * The bubble asks it to record; it transcribes and formats through Studio.
 */
class RecorderService : Service() {

    interface Listener {
        fun onState(listening: Boolean, working: Boolean)
        fun onStatus(text: String)
        fun onResult(text: String)
        fun onError(text: String)
    }

    companion object {
        private const val CHANNEL = "studio_flow"
        private const val NOTE_ID = 7
        const val ACTION_STOP = "studio.karanparmar.flow.STOP"
        private const val MAX_MS = 5 * 60 * 1000L
        private const val CHUNK_SECONDS = 20

        fun start(context: Context) {
            val intent = Intent(context, RecorderService::class.java)
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, RecorderService::class.java))
        }
    }

    @Volatile var listening = false
        private set
    @Volatile var working = false
        private set

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Flow.recorder = this
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        val note = notification()
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTE_ID, note, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(NOTE_ID, note)
        }
        Flow.bubble?.refresh()
        // Not sticky: a restart by the system from the background may not be allowed to
        // use the microphone. The user starts it again from the app or the bubble.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        listening = false
        if (Flow.recorder === this) Flow.recorder = null
        Flow.bubble?.refresh()
        super.onDestroy()
    }

    /** Returns a message if recording cannot start, or null when it started. */
    fun startTake(listener: Listener): String? {
        if (listening || working) return null
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            return "Open Studio Flow and allow the microphone."
        }
        val prefs = FlowClient.prefs(this)
        val apiKey = prefs.getString("api_key", "").orEmpty()
        if (apiKey.isBlank()) return "Open Studio Flow and add your API key."
        val script = prefs.getString("script", "roman").orEmpty()
        listening = true
        listener.onState(true, false)
        Thread { record(listener, apiKey, script) }.start()
        return null
    }

    fun stopTake() {
        listening = false
    }

    private fun record(listener: Listener, apiKey: String, script: String) {
        val min = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        if (min <= 0) {
            finish(listener, "The microphone did not open.")
            return
        }
        val recorder = try {
            AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                16000,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                min * 2,
            )
        } catch (exc: Exception) {
            finish(listener, "The microphone did not open.")
            return
        }
        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            recorder.release()
            finish(listener, "The microphone did not open.")
            return
        }
        val pcm = PcmBuffer()
        val buf = ByteArray(min)
        val started = SystemClock.elapsedRealtime()
        val chunkBytes = 16000 * 2 * CHUNK_SECONDS
        // Chunks are transcribed one after another on this worker while you keep talking,
        // so only the last piece and the format step are left when you stop.
        val worker = Executors.newSingleThreadExecutor()
        val parts = CopyOnWriteArrayList<String>()
        val firstError = AtomicReference<String?>(null)
        var sent = 0
        var shown = -1

        fun submit(chunk: ByteArray) {
            worker.execute {
                if (firstError.get() != null) return@execute
                try {
                    val heard = FlowClient.transcribe(FlowClient.STUDIO, apiKey, chunk) {}
                    if (heard.isNotBlank()) parts.add(heard)
                } catch (exc: Exception) {
                    firstError.compareAndSet(null, exc.message ?: "The request failed")
                }
            }
        }

        fun preview(): String {
            val heard = parts.joinToString(" ")
            if (heard.isBlank()) return ""
            return "\n" + if (heard.length <= 90) heard else "…" + heard.takeLast(89)
        }

        recorder.startRecording()
        try {
            while (listening && SystemClock.elapsedRealtime() - started < MAX_MS) {
                val count = recorder.read(buf, 0, buf.size)
                pcm.write(buf, count)
                if (pcm.size() - sent >= chunkBytes) {
                    val all = pcm.bytes()
                    val cut = FlowClient.quietCut(all, sent, all.size)
                    if (cut - sent >= 16000 * 2) {
                        submit(all.copyOfRange(sent, cut))
                        sent = cut
                    }
                }
                val seconds = ((SystemClock.elapsedRealtime() - started) / 1000).toInt()
                if (seconds != shown) {
                    shown = seconds
                    listener.onStatus("Listening ${seconds / 60}:${(seconds % 60).toString().padStart(2, '0')}  ·  tap to stop" + preview())
                }
            }
        } finally {
            listening = false
            try { recorder.stop() } catch (_: Exception) {}
            recorder.release()
        }
        working = true
        listener.onState(false, true)
        listener.onStatus("Transcribing…")
        try {
            val all = pcm.bytes()
            if (all.size - sent >= (16000 * 2 * 0.4).toInt()) submit(all.copyOfRange(sent, all.size))
            worker.shutdown()
            worker.awaitTermination(5, TimeUnit.MINUTES)
            firstError.get()?.let { throw IllegalStateException(it) }
            val full = parts.joinToString(" ").trim()
            if (full.isEmpty()) {
                listener.onError("Didn't catch that. Tap the bubble and speak a little longer.")
                return
            }
            listener.onStatus("Shaping the text…")
            val shaped = FlowClient.format(FlowClient.STUDIO, apiKey, full, script, listener::onStatus)
            listener.onResult(shaped.ifBlank { full })
        } catch (exc: Exception) {
            listener.onError(exc.message ?: "The request failed")
        } finally {
            worker.shutdownNow()
            working = false
            listener.onState(false, false)
        }
    }

    private fun finish(listener: Listener, message: String) {
        listening = false
        working = false
        listener.onState(false, false)
        listener.onError(message)
    }

    private fun notification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL, "Studio Flow", NotificationManager.IMPORTANCE_LOW),
            )
        }
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, SettingsActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        val stop = PendingIntent.getService(
            this, 1, Intent(this, RecorderService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
        @Suppress("DEPRECATION")
        return builder
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Studio Flow is ready")
            .setContentText("Tap the bubble next to any text box to dictate.")
            .setContentIntent(open)
            .setOngoing(true)
            .addAction(Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stop).build())
            .build()
    }
}
