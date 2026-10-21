package studio.karanparmar.flow

import android.accessibilityservice.AccessibilityService
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

/**
 * The floating Studio Flow bubble.
 *
 * It appears beside the screen while a text box is focused in any app, sits above your
 * normal keyboard, and never takes focus away from the text box. Tap it to record,
 * tap again to stop. The formatted text is written into the focused box at the cursor;
 * if no box is focused any more, it is copied to the clipboard instead.
 */
class FlowAccessibilityService : AccessibilityService(), RecorderService.Listener {

    private val main = Handler(Looper.getMainLooper())
    private lateinit var windows: WindowManager
    private var root: LinearLayout? = null
    private var bubble: TextView? = null
    private var label: TextView? = null
    private var params: WindowManager.LayoutParams? = null
    private var listening = false
    private var working = false

    private val evaluate = Runnable { updateVisibility() }
    private val hideLater = Runnable { if (!listening && !working) setVisible(false) }
    private val clearLabel = Runnable { if (!listening && !working) showLabel(null) }

    // ------------------------------------------------------------ lifecycle
    override fun onServiceConnected() {
        super.onServiceConnected()
        windows = getSystemService(WINDOW_SERVICE) as WindowManager
        Flow.bubble = this
        build()
        updateVisibility()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        main.removeCallbacks(evaluate)
        main.postDelayed(evaluate, 150)
    }

    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        teardown()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        teardown()
        super.onDestroy()
    }

    private fun teardown() {
        main.removeCallbacksAndMessages(null)
        root?.let { runCatching { windows.removeView(it) } }
        root = null
        if (Flow.bubble === this) Flow.bubble = null
    }

    /** Called by the recorder service when it starts or stops. */
    fun refresh() {
        main.post { paint() }
    }

    // ------------------------------------------------------------ view
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun build() {
        val face = TextView(this).apply {
            textSize = 22f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            elevation = dp(6).toFloat()
        }
        val note = TextView(this).apply {
            textSize = 13f
            setTextColor(Color.parseColor("#ccd6f6"))
            background = GradientDrawable().apply {
                cornerRadius = dp(14).toFloat()
                setColor(Color.parseColor("#F00a192f"))
                setStroke(dp(1), Color.parseColor("#2264ffda"))
            }
            setPadding(dp(12), dp(7), dp(12), dp(7))
            maxWidth = dp(240)
            visibility = View.GONE
        }
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(face, LinearLayout.LayoutParams(dp(54), dp(54)))
            addView(note, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { marginStart = dp(8) })
            visibility = View.GONE
        }
        val prefs = FlowClient.prefs(this)
        val layout = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            // Never focusable: the text box in the other app must keep the keyboard and cursor.
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = prefs.getInt("bubble_x", dp(6))
            y = prefs.getInt("bubble_y", dp(240))
        }
        face.setOnTouchListener(Dragger())
        runCatching { windows.addView(row, layout) }
        root = row
        bubble = face
        label = note
        params = layout
        paint()
    }

    private fun paint() {
        val face = bubble ?: return
        val ready = Flow.recorder != null
        val (fill, ring, glyph) = when {
            listening -> Triple("#e5484d", "#ffffff", "■")
            working -> Triple("#112240", "#64ffda", "…")
            ready -> Triple("#0a192f", "#64ffda", "🎙")
            else -> Triple("#233554", "#8892b0", "🎙")
        }
        face.text = glyph
        face.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(fill))
            setStroke(dp(2), Color.parseColor(ring))
        }
        face.alpha = if (ready || listening || working) 1f else 0.75f
    }

    private fun setVisible(show: Boolean) {
        root?.visibility = if (show) View.VISIBLE else View.GONE
    }

    private fun showLabel(text: String?, holdMs: Long = 0) {
        val note = label ?: return
        main.removeCallbacks(clearLabel)
        if (text.isNullOrBlank()) {
            note.visibility = View.GONE
            return
        }
        note.text = text
        note.visibility = View.VISIBLE
        if (holdMs > 0) main.postDelayed(clearLabel, holdMs)
    }

    private fun focusedInput(): AccessibilityNodeInfo? = try {
        rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)?.takeIf { it.isEditable }
    } catch (_: Exception) {
        null
    }

    private fun updateVisibility() {
        if (listening || working || focusedInput() != null) {
            main.removeCallbacks(hideLater)
            setVisible(true)
        } else {
            main.removeCallbacks(hideLater)
            main.postDelayed(hideLater, 1500)
        }
    }

    // ------------------------------------------------------------ tap
    private fun onTap() {
        val recorder = Flow.recorder
        if (recorder == null) {
            // The microphone service must be started from the app screen (an Android rule).
            showLabel("Starting Studio Flow…", 3000)
            startActivity(
                Intent(this, SettingsActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .putExtra(SettingsActivity.EXTRA_START_AND_CLOSE, true),
            )
            return
        }
        when {
            listening -> recorder.stopTake()
            working -> showLabel("Still working on the last take…", 2000)
            else -> recorder.startTake(this)?.let { showLabel(it, 4000) }
        }
    }

    // ------------------------------------------------------------ recorder callbacks
    override fun onState(listening: Boolean, working: Boolean) {
        main.post {
            this.listening = listening
            this.working = working
            paint()
            if (listening) showLabel("Listening 0:00  ·  tap to stop")
            updateVisibility()
        }
    }

    override fun onStatus(text: String) {
        main.post { showLabel(text) }
    }

    override fun onResult(text: String) {
        main.post {
            if (insert(text)) {
                showLabel("Inserted.", 1500)
            } else {
                copy(text)
                showLabel("Copied. Long-press the text box and paste.", 4000)
            }
        }
    }

    override fun onError(text: String) {
        main.post { showLabel(text, 4000) }
    }

    // ------------------------------------------------------------ insertion
    /** Writes text into the focused box at the cursor. Falls back to paste. */
    private fun insert(text: String): Boolean {
        val node = focusedInput() ?: return false
        val showingHint = Build.VERSION.SDK_INT >= 26 && node.isShowingHintText
        val current = if (showingHint) "" else node.text?.toString().orEmpty()
        var start = node.textSelectionStart
        var end = node.textSelectionEnd
        if (start < 0 || end < 0 || start > current.length || end > current.length) {
            start = current.length
            end = current.length
        }
        val from = minOf(start, end)
        val to = maxOf(start, end)
        val spacer = if (from > 0 && !current[from - 1].isWhitespace()) " " else ""
        val piece = spacer + text
        val merged = current.substring(0, from) + piece + current.substring(to)
        val setText = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, merged)
        }
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, setText)) {
            val caret = from + piece.length
            node.performAction(
                AccessibilityNodeInfo.ACTION_SET_SELECTION,
                Bundle().apply {
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, caret)
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, caret)
                },
            )
            return true
        }
        copy(text)
        return node.performAction(AccessibilityNodeInfo.ACTION_PASTE)
    }

    private fun copy(text: String) {
        val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("Studio Flow", text))
    }

    // ------------------------------------------------------------ dragging
    private inner class Dragger : View.OnTouchListener {
        private val slop = ViewConfiguration.get(this@FlowAccessibilityService).scaledTouchSlop
        private var downX = 0f
        private var downY = 0f
        private var startX = 0
        private var startY = 0
        private var moved = false

        override fun onTouch(view: View, event: MotionEvent): Boolean {
            val layout = params ?: return false
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = event.rawX
                    downY = event.rawY
                    startX = layout.x
                    startY = layout.y
                    moved = false
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    if (moved || abs(dx) > slop || abs(dy) > slop) {
                        moved = true
                        layout.x = startX + dx.toInt()
                        layout.y = startY + dy.toInt()
                        root?.let { runCatching { windows.updateViewLayout(it, layout) } }
                    }
                }
                MotionEvent.ACTION_UP -> {
                    if (moved) {
                        FlowClient.prefs(this@FlowAccessibilityService).edit()
                            .putInt("bubble_x", layout.x)
                            .putInt("bubble_y", layout.y)
                            .apply()
                    } else {
                        view.performClick()
                        onTap()
                    }
                }
            }
            return true
        }
    }
}
