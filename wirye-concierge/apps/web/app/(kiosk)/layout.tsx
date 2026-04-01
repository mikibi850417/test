import Link from "next/link";
import type { ReactNode } from "react";

import { KioskRuntime } from "@/components/kiosk-runtime";
import { VoiceConcierge } from "@/components/voice-concierge";

const quickLinks = [
  { href: "/hotel", label: "호텔 안내" },
  { href: "/dining", label: "식음" },
  { href: "/facilities", label: "부대시설" },
  { href: "/services", label: "서비스" },
  { href: "/transport", label: "교통" },
  { href: "/nearby", label: "주변 추천" },
  { href: "/faq", label: "FAQ" },
];

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <KioskRuntime>
      <div className="kiosk-shell">
        <header className="kiosk-topbar">
          <Link className="kiosk-brand" href="/">
            <span className="kiosk-brand-mark">WM</span>
            <span>
              <strong>Militopia Concierge</strong>
              <small>Luxury Lobby Guide</small>
            </span>
          </Link>

          <nav className="kiosk-quick-nav" aria-label="Quick navigation">
            {quickLinks.map((link) => (
              <Link key={link.href} className="kiosk-quick-link" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}
        <VoiceConcierge />
      </div>
    </KioskRuntime>
  );
}
