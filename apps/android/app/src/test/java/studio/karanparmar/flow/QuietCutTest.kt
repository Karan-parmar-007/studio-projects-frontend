package studio.karanparmar.flow

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayOutputStream
import kotlin.math.PI
import kotlin.math.sin

/** Same cases as the desktop tests: chunks end on a pause, never inside a word. */
class QuietCutTest {
    private val rate = 16000

    private fun tone(seconds: Double): ByteArray {
        val out = ByteArrayOutputStream()
        for (i in 0 until (rate * seconds).toInt()) {
            val v = (8000 * sin(2 * PI * 300 * i / rate)).toInt()
            out.write(v and 0xff)
            out.write((v shr 8) and 0xff)
        }
        return out.toByteArray()
    }

    private fun silence(seconds: Double) = ByteArray((rate * seconds).toInt() * 2)

    @Test
    fun cutsInsideThePause() {
        val pcm = tone(17.5) + silence(0.6) + tone(2.0)
        val cut = FlowClient.quietCut(pcm, 0, pcm.size)
        val pauseStart = (rate * 17.5).toInt() * 2
        val pauseEnd = pauseStart + (rate * 0.6).toInt() * 2
        assertTrue("cut $cut not in pause [$pauseStart, $pauseEnd]", cut in pauseStart..pauseEnd)
        assertEquals(0, cut % 2)
    }

    @Test
    fun onlyLooksInTheLastSeconds() {
        val pcm = silence(1.0) + tone(19.0)
        val cut = FlowClient.quietCut(pcm, 0, pcm.size, searchSeconds = 4.0)
        assertTrue(cut >= pcm.size - (rate * 4.0).toInt() * 2)
    }

    @Test
    fun shortAudioIsNotCut() {
        val pcm = tone(0.4)
        assertEquals(pcm.size, FlowClient.quietCut(pcm, 0, pcm.size))
    }

    @Test
    fun respectsTheStartOffset() {
        val pcm = silence(2.0) + tone(10.0)
        val start = (rate * 9.0).toInt() * 2
        val cut = FlowClient.quietCut(pcm, start, pcm.size)
        assertTrue(cut > start && cut <= pcm.size)
    }
}
