package com.wirye.kiosk

import android.app.Activity

object DevicePolicyHelper {
    fun enableLockTaskMode(activity: Activity) {
        try {
            activity.startLockTask()
        } catch (_: Exception) {
            // Lock task mode may not be available during development.
        }
    }
}
