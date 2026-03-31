import Link from "next/link";

const categories = [
  { href: "/hotel", label: "호텔 안내" },
  { href: "/dining", label: "식음 안내" },
  { href: "/facilities", label: "부대시설" },
  { href: "/services", label: "호텔 서비스" },
  { href: "/transport", label: "교통 / 오시는 길" },
  { href: "/nearby", label: "주변 인프라" },
  { href: "/emergency", label: "응급 안내" },
  { href: "/faq", label: "FAQ" },
  { href: "/notices", label: "공지" },
];

export default function KioskHomePage() {
  return (
    <main>
      <div className="card">
        <h1>위례 밀리토피아호텔 컨시어지</h1>
        <p className="subtext">
          Phase 1 kiosk shell page. Public snapshot data wiring is next.
        </p>
      </div>

      <div style={{ height: "0.8rem" }} />

      <div className="grid">
        {categories.map((item) => (
          <Link key={item.label} className="button" href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
