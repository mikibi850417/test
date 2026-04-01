import Link from "next/link";

const menus = [
  { href: "/admin/login", label: "로그인" },
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/imports", label: "Import 관리" },
  { href: "/admin/nearby-places", label: "주변 장소 관리" },
  { href: "/admin/conflicts", label: "충돌 관리" },
  { href: "/admin/publish", label: "발행 관리" },
  { href: "/admin/concierge-inbox", label: "컨시어지 인박스" },
  { href: "/admin/devices", label: "디바이스 상태" },
  { href: "/admin/audit-logs", label: "감사 로그" },
];

export default function AdminHomePage() {
  return (
    <main>
      <div className="card">
        <h1>Admin Console</h1>
        <p className="subtext">호텔 컨시어지 운영자 콘솔입니다.</p>
      </div>

      <div style={{ height: "0.8rem" }} />
      <div className="grid">
        {menus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="button">
            {menu.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
