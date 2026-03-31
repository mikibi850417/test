package com.wirye.kiosk

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    private lateinit var kioskWebView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        kioskWebView = findViewById(R.id.kiosk_webview)
        kioskWebView.webViewClient = KioskWebViewClient()
        kioskWebView.webChromeClient = KioskWebChromeClient()
        kioskWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = true
        }
        kioskWebView.loadUrl(SettingsRepository.BASE_URL)

        // Keep screen awake in kiosk mode.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        enableImmersiveMode()
        DevicePolicyHelper.enableLockTaskMode(this)
        setupHeartbeat()
    }

    override fun onBackPressed() {
        if (kioskWebView.canGoBack()) {
            kioskWebView.goBack()
            return
        }
        // Intentionally ignore app exit in kiosk mode.
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableImmersiveMode()
        }
    }

    private fun enableImmersiveMode() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
    }

    private fun setupHeartbeat() {
        if (!SettingsRepository.HEARTBEAT_ENABLED) return
        val request =
            PeriodicWorkRequestBuilder<HeartbeatWorker>(
                SettingsRepository.HEARTBEAT_INTERVAL_MIN,
                TimeUnit.MINUTES,
            ).build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "kiosk-heartbeat",
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }
}
