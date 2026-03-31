"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const HOME_PATH = "/";
const DEFAULT_IDLE_SECONDS = 90;

function readIdleSeconds(): number {
  const raw = Number(process.env.NEXT_PUBLIC_KIOSK_IDLE_HOME_SECONDS ?? DEFAULT_IDLE_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_IDLE_SECONDS;
  }
  return raw;
}

export function KioskRuntime({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(window.navigator.onLine);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (pathname === HOME_PATH) {
      return;
    }

    const idleMs = readIdleSeconds() * 1000;
    const resetIdleTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        router.push(HOME_PATH);
      }, idleMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "pointerdown",
      "mousemove",
      "keydown",
      "touchstart",
      "wheel",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer));
    resetIdleTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [pathname, router]);

  return (
    <>
      {!online ? (
        <div className="kiosk-offline-banner" role="status" aria-live="polite">
          네트워크 연결이 일시적으로 끊겼습니다. 마지막 데이터 기준으로 계속 표시합니다.
        </div>
      ) : null}
      {children}
    </>
  );
}
