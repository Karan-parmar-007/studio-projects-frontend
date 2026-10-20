package studio.karanparmar.flow

import android.Manifest
import android.content.pm.PackageManager
import android.inputmethodservice.InputMethodService
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.SystemClock
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class StudioImeService : InputMethodService() {
    private var statusView: TextView? = null
    private var micButton: Button? = null
    private var shift = false
    private var listening = false
    private var working = false
    private var letters: List<Button> = emptyList()

    override fun onCreateInputView(): View {
        val view = layoutInflater.inflate(R.layout.keyboard, null)
        statusView = view.findViewById(R.id.status)
        val found = ArrayList<Button>()
        collect(view, found)
        letters = found.filter { (it.tag as? String)?.length == 1 && (it.tag as String)[0].isLetter() }
        for (button in found) {
            button.setOnClickListener { onKey(button) }
            if (button.tag == "mic") micButton = button
        }
        return view
    }

    private fun collect(view: View, out: MutableList<Button>) {
        if (view is Button) out.add(view)
        if (view is LinearLayout) {
            for (index in 0 until view.childCount) collect(view.getChildAt(index), out)
        }
    }

    private fun onKey(button: Button) {
        when (val tag = button.tag as? String ?: return) {
            "mic" -> toggleMic()
            "space" -> commit(" ")
            "back" -> currentInputConnection?.deleteSurroundingText(1, 0)
            "enter" -> commit("\n")
            "shift" -> {
                shift = !shift
                for (letter in letters) {
                    val value = (letter.tag as String)
                    letter.text = if (shift) value.uppercase() else value
                }
            }
            else -> {
                commit(if (shift && tag.length == 1 && tag[0].isLetter()) tag.uppercase() else tag)
                if (shift && tag.length == 1 && tag[0].isLetter()) {
                    shift = false
                    for (letter in letters) letter.text = letter.tag as String
                }
            }
        }
    }

    private fun commit(text: String) {
        currentInputConnection?.commitText(text, 1)
    }

    private fun status(text: String) {
        statusView?.post { statusView?.text = text }
    }

    private fun toggleMic() {
        if (working) return
        if (listening) {
            listening = false
            return
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            status("Open Studio Flow and allow the microphone.")
            return
        }
        val prefs = FlowClient.prefs(this)
        val apiKey = prefs.getString("api_key", "").orEmpty()
        if (apiKey.isBlank()) {
            status("Add your API key in Studio Flow settings.")
            return
        }
        listening = true
        micButton?.text = "Stop"
        status("Listening 0:00")
        val script = prefs.getString("script", "roman").orEmpty()
        val studio = FlowClient.studioBase(this)
        Thread {
            recordThenInsert(studio, apiKey, script)
        }.start()
    }

    private fun recordThenInsert(studio: String, apiKey: String, script: String) {
        val min = AudioRecord.getMinBufferSize(
            16000,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (min <= 0) {
            finishListening("The microphone did not open.")
            return
        }
        val recorder = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            16000,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            min * 2,
        )
        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            finishListening("The microphone did not open.")
            return
        }
        val pcm = PcmBuffer()
        val buf = ByteArray(min)
        val started = SystemClock.elapsedRealtime()
        var shownSecond = -1
        recorder.startRecording()
        try {
            while (listening && SystemClock.elapsedRealtime() - started < 5 * 60 * 1000) {
                val count = recorder.read(buf, 0, buf.size)
                pcm.write(buf, count)
                val seconds = ((SystemClock.elapsedRealtime() - started) / 1000).toInt()
                if (seconds != shownSecond) {
                    shownSecond = seconds
                    status("Listening ${seconds / 60}:${(seconds % 60).toString().padStart(2, '0')}")
                }
            }
        } finally {
            listening = false
            recorder.stop()
            recorder.release()
        }
        working = true
        status("Transcribing…")
        try {
            val take = FlowClient.dictate(studio, apiKey, pcm.bytes(), script, ::status)
            if (take.text.isNotBlank()) {
                statusView?.post { currentInputConnection?.commitText(take.text, 1) }
            }
            status(take.note)
        } catch (exc: Exception) {
            status(exc.message ?: "The request failed")
        } finally {
            finishListening(null)
        }
    }

    private fun finishListening(message: String?) {
        listening = false
        working = false
        statusView?.post {
            micButton?.text = "Mic"
            if (message != null) statusView?.text = message
        }
    }
}
