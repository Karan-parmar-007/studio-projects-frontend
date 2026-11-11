package studio.karanparmar.flow

import android.util.Base64
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

object FlowClient {
    /** Every request goes to the Studio server. Users only enter their API key. */
    val STUDIO: String = BuildConfig.STUDIO_URL.trimEnd('/')

    /** Transcribe one chunk of 16 kHz mono PCM. Returns the raw words (may be empty). */
    fun transcribe(studio: String, apiKey: String, pcm: ByteArray, onStatus: (String) -> Unit): String =
        call(
            studio,
            "/api/studio/v1/whisperflow/transcribe",
            apiKey,
            JSONObject().put("audio_base64", b64(wav(pcm))),
            onStatus,
        ).trim()

    /** Clean the whole transcript once: fillers, lists, and spoken corrections. */
    fun format(studio: String, apiKey: String, text: String, script: String, onStatus: (String) -> Unit): String =
        call(
            studio,
            "/api/studio/v1/whisperflow/format",
            apiKey,
            JSONObject().put("text", text).put("script", script).put("tone", "plain"),
            onStatus,
        )

    /**
     * Where to end a chunk: the quietest moment in the last few seconds before [end].
     * Cutting on a pause keeps words whole. Byte offsets into 16-bit mono PCM; the
     * result is even and in (start, end].
     */
    fun quietCut(pcm: ByteArray, start: Int, end: Int, rate: Int = 16000, searchSeconds: Double = 4.0): Int {
        val last = end - end % 2
        val window = (rate * 0.3).toInt() * 2
        var lo = maxOf(start, last - (rate * searchSeconds).toInt() * 2)
        lo += (lo - start) % 2
        if (last - lo < window * 2) return last
        val samples = (last - lo) / 2
        val span = window / 2
        val step = maxOf(1, (rate * 0.05).toInt())
        var bestAt = samples
        var bestEnergy = Long.MAX_VALUE
        var at = 0
        while (at + span <= samples) {
            var energy = 0L
            var i = at
            while (i < at + span) {
                val index = lo + i * 2
                val value = ((pcm[index + 1].toInt() shl 8) or (pcm[index].toInt() and 0xff)).toShort().toInt()
                energy += kotlin.math.abs(value)
                i++
            }
            if (energy < bestEnergy) {
                bestEnergy = energy
                bestAt = at + span / 2
            }
            at += step
        }
        return lo + bestAt * 2
    }

    private fun call(studio: String, path: String, apiKey: String, payload: JSONObject, onStatus: (String) -> Unit): String {
        val (code, body) = post("$studio$path", apiKey, payload)
        if (code == 202) return wait(studio, apiKey, body, onStatus)
        if (code >= 400) throw IllegalStateException(detail(body))
        return body.optString("text")
    }

    private fun wait(studio: String, apiKey: String, first: JSONObject, onStatus: (String) -> Unit): String {
        var job = first
        while (true) {
            when (job.optString("status")) {
                "queued" -> onStatus(
                    "Your request is queued. ${job.optString("lane", "voice")} line, position ${job.optInt("position", 1)}.",
                )
                "running" -> onStatus("Your request is running.")
                "done" -> {
                    val result = job.optJSONObject("result")
                    return result?.optString("text") ?: job.optString("text")
                }
                "error" -> throw IllegalStateException(detail(job))
                else -> {
                    if (job.optString("text").isNotBlank() && job.optString("status").isBlank()) {
                        return job.optString("text")
                    }
                    throw IllegalStateException(detail(job))
                }
            }
            Thread.sleep(1200)
            val jobId = job.optString("job_id").ifBlank { job.optString("id") }
            val poll = job.optString("poll").ifBlank { "/api/studio/v1/whisperflow/jobs/$jobId" }
            val (code, body) = get("$studio$poll", apiKey)
            if (code >= 400) throw IllegalStateException(detail(body))
            job = body
        }
    }

    private fun detail(body: JSONObject): String {
        val text = body.optString("detail")
        if (text.isNotBlank()) return text
        return "The app is currently not working."
    }

    private fun post(url: String, apiKey: String, payload: JSONObject): Pair<Int, JSONObject> {
        val connection = open(url, apiKey)
        connection.requestMethod = "POST"
        connection.doOutput = true
        val bytes = payload.toString().toByteArray()
        connection.setFixedLengthStreamingMode(bytes.size)
        connection.outputStream.use { it.write(bytes) }
        return read(connection)
    }

    private fun get(url: String, apiKey: String): Pair<Int, JSONObject> {
        val connection = open(url, apiKey)
        connection.requestMethod = "GET"
        return read(connection)
    }

    private fun open(url: String, apiKey: String): HttpURLConnection {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 8000
        connection.readTimeout = 180000
        connection.setRequestProperty("Content-Type", "application/json")
        if (apiKey.isNotBlank()) connection.setRequestProperty("Authorization", "Bearer $apiKey")
        return connection
    }

    private fun read(connection: HttpURLConnection): Pair<Int, JSONObject> {
        val code = connection.responseCode
        val stream = if (code >= 400) connection.errorStream else connection.inputStream
        val raw = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        val body = if (raw.isBlank()) JSONObject() else JSONObject(raw)
        return code to body
    }

    fun wav(pcm: ByteArray, rate: Int = 16000): ByteArray {
        val out = ByteArray(44 + pcm.size)
        fun le16(at: Int, value: Int) {
            out[at] = (value and 0xff).toByte()
            out[at + 1] = ((value shr 8) and 0xff).toByte()
        }
        fun le32(at: Int, value: Int) {
            le16(at, value)
            le16(at + 2, value shr 16)
        }
        out[0] = 'R'.code.toByte()
        out[1] = 'I'.code.toByte()
        out[2] = 'F'.code.toByte()
        out[3] = 'F'.code.toByte()
        le32(4, 36 + pcm.size)
        out[8] = 'W'.code.toByte()
        out[9] = 'A'.code.toByte()
        out[10] = 'V'.code.toByte()
        out[11] = 'E'.code.toByte()
        out[12] = 'f'.code.toByte()
        out[13] = 'm'.code.toByte()
        out[14] = 't'.code.toByte()
        out[15] = ' '.code.toByte()
        le32(16, 16)
        le16(20, 1)
        le16(22, 1)
        le32(24, rate)
        le32(28, rate * 2)
        le16(32, 2)
        le16(34, 16)
        out[36] = 'd'.code.toByte()
        out[37] = 'a'.code.toByte()
        out[38] = 't'.code.toByte()
        out[39] = 'a'.code.toByte()
        le32(40, pcm.size)
        System.arraycopy(pcm, 0, out, 44, pcm.size)
        return out
    }

    private fun b64(data: ByteArray): String = Base64.encodeToString(data, Base64.NO_WRAP)

    fun prefs(context: android.content.Context) =
        context.getSharedPreferences("flow", android.content.Context.MODE_PRIVATE)
}

class PcmBuffer {
    private val out = ByteArrayOutputStream()

    fun write(buf: ByteArray, count: Int) {
        if (count > 0) out.write(buf, 0, count)
    }

    fun size(): Int = out.size()

    fun bytes(): ByteArray = out.toByteArray()
}
