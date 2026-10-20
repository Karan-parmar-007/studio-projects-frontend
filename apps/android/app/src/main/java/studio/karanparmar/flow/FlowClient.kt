package studio.karanparmar.flow

import android.util.Base64
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

data class Take(val text: String, val note: String)

object FlowClient {
    const val DEFAULT_STUDIO = "https://studio.karanparmar.in"

    fun studioBase(context: android.content.Context): String {
        val saved = prefs(context).getString("studio", DEFAULT_STUDIO).orEmpty().trim().trimEnd('/')
        return if (saved.startsWith("http")) saved else DEFAULT_STUDIO
    }

    fun dictate(
        studio: String,
        apiKey: String,
        pcm: ByteArray,
        script: String,
        onStatus: (String) -> Unit,
    ): Take {
        val rate = 16000
        val step = rate * 2 * 20
        val parts = ArrayList<String>()
        var offset = 0
        var index = 1
        while (offset < pcm.size) {
            val end = minOf(pcm.size, offset + step)
            val chunk = pcm.copyOfRange(offset, end)
            if (chunk.size >= rate) {
                onStatus("Transcribing $index…")
                val text = call(studio, "/api/studio/v1/whisperflow/transcribe", apiKey, JSONObject().put("audio_base64", b64(wav(chunk))), onStatus)
                if (text.isNotBlank()) parts.add(text.trim())
                index += 1
            }
            offset = end
        }
        val full = parts.joinToString(" ").trim()
        if (full.isEmpty()) return Take("", "Didn't catch that. Tap the mic and speak a little longer.")
        onStatus("Shaping the text…")
        val shaped = call(
            studio,
            "/api/studio/v1/whisperflow/format",
            apiKey,
            JSONObject().put("text", full).put("script", script).put("tone", "plain"),
            onStatus,
        )
        return Take(shaped.ifBlank { full }, "Inserted.")
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

    fun bytes(): ByteArray = out.toByteArray()
}
