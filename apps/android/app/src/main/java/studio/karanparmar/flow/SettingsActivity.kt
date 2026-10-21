package studio.karanparmar.flow

import android.Manifest
import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.TextView

class SettingsActivity : Activity() {

    companion object {
        /** Sent by the bubble when Studio Flow is not running: start it, then get out of the way. */
        const val EXTRA_START_AND_CLOSE = "start_and_close"
    }

    private lateinit var checklist: TextView
    private lateinit var startStop: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (intent.getBooleanExtra(EXTRA_START_AND_CLOSE, false)) {
            if (ready()) RecorderService.start(this)
            finish()
            return
        }
        setContentView(R.layout.settings)
        val prefs = FlowClient.prefs(this)
        val apiKey = findViewById<EditText>(R.id.apiKey)
        val devanagari = findViewById<CheckBox>(R.id.devanagari)
        checklist = findViewById(R.id.checklist)
        startStop = findViewById(R.id.startStop)
        apiKey.setText(prefs.getString("api_key", ""))
        devanagari.isChecked = prefs.getString("script", "roman") == "devanagari"

        findViewById<Button>(R.id.save).setOnClickListener {
            prefs.edit()
                .putString("api_key", apiKey.text.toString().trim())
                .putString("script", if (devanagari.isChecked) "devanagari" else "roman")
                .apply()
            refresh()
        }
        findViewById<Button>(R.id.allowMic).setOnClickListener {
            val wanted = mutableListOf(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= 33) wanted += Manifest.permission.POST_NOTIFICATIONS
            requestPermissions(wanted.toTypedArray(), 1)
        }
        findViewById<Button>(R.id.turnOnBubble).setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        findViewById<Button>(R.id.appInfo).setOnClickListener {
            startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    .setData(Uri.fromParts("package", packageName, null)),
            )
        }
        startStop.setOnClickListener {
            if (Flow.recorder != null) RecorderService.stop(this) else if (ready()) RecorderService.start(this)
            startStop.postDelayed({ refresh() }, 300)
        }
    }

    override fun onResume() {
        super.onResume()
        if (!::checklist.isInitialized) return
        // Opening the app is enough to get Studio Flow running once everything is set up.
        if (ready() && Flow.recorder == null) RecorderService.start(this)
        checklist.postDelayed({ refresh() }, 300)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (ready() && Flow.recorder == null) RecorderService.start(this)
        checklist.postDelayed({ refresh() }, 300)
    }

    private fun hasKey() = FlowClient.prefs(this).getString("api_key", "").orEmpty().isNotBlank()

    private fun hasMic() = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun bubbleOn(): Boolean {
        if (Flow.bubble != null) return true
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty()
        val me = ComponentName(this, FlowAccessibilityService::class.java).flattenToString()
        return enabled.split(':').any { it.equals(me, ignoreCase = true) }
    }

    private fun ready() = hasKey() && hasMic()

    private fun refresh() {
        fun line(ok: Boolean, text: String) = (if (ok) "✓  " else "○  ") + text
        val running = Flow.recorder != null
        checklist.text = listOf(
            line(hasKey(), "API key saved"),
            line(hasMic(), "Microphone allowed"),
            line(bubbleOn(), "Bubble turned on (Accessibility)"),
            line(running, if (running) "Studio Flow is running" else "Studio Flow is stopped"),
        ).joinToString("\n")
        startStop.text = if (running) "Stop Studio Flow" else "Start Studio Flow"
        startStop.isEnabled = running || ready()
    }
}
