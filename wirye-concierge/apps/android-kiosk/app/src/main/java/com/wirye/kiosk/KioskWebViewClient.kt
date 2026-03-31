package com.wirye.kiosk

import android.content.Intent
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class KioskWebViewClient : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url ?: return false
        val baseHost = Uri.parse(SettingsRepository.BASE_URL).host
        val requestHost = url.host

        if (baseHost != null && requestHost == baseHost) {
            return false
        }
        if (!SettingsRepository.ALLOW_EXTERNAL_LINKS) {
            return true
        }

        val context = view?.context ?: return true
        context.startActivity(Intent(Intent.ACTION_VIEW, url))
        return true
    }
}
