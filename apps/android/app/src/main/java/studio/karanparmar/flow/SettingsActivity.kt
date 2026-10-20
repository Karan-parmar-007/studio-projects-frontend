package studio.karanparmar.flow

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.TextView
import android.app.Activity

class SettingsActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.settings)
        val prefs = FlowClient.prefs(this)
        val apiKey = findViewById<EditText>(R.id.apiKey)
        val studioUrl = findViewById<EditText>(R.id.studioUrl)
        val devanagari = findViewById<CheckBox>(R.id.devanagari)
        val status = findViewById<TextView>(R.id.setupStatus)
        apiKey.setText(prefs.getString("api_key", ""))
        studioUrl.setText(prefs.getString("studio", FlowClient.DEFAULT_STUDIO))
        devanagari.isChecked = prefs.getString("script", "roman") == "devanagari"

        findViewById<Button>(R.id.save).setOnClickListener {
            prefs.edit()
                .putString("api_key", apiKey.text.toString().trim())
                .putString("studio", studioUrl.text.toString().trim().trimEnd('/'))
                .putString("script", if (devanagari.isChecked) "devanagari" else "roman")
                .apply()
            status.text = "Saved."
        }
        findViewById<Button>(R.id.allowMic).setOnClickListener {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 1)
        }
        findViewById<Button>(R.id.keyboardSettings).setOnClickListener {
            startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
        }
        findViewById<Button>(R.id.pickKeyboard).setOnClickListener {
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showInputMethodPicker()
        }
        val allowed = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        status.text = if (allowed) "Microphone allowed." else "Allow the microphone before the first take."
    }
}
