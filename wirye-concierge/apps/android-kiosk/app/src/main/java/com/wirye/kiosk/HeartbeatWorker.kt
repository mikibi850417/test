package com.wirye.kiosk

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class HeartbeatWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        // TODO: send heartbeat to /api/v1/internal/devices/heartbeat
        return Result.success()
    }
}
