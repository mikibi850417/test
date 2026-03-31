import type { ReactNode } from "react";

import { KioskRuntime } from "@/components/kiosk-runtime";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return <KioskRuntime>{children}</KioskRuntime>;
}
