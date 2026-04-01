import Link from "next/link";

const categories = [
  {
    href: "/hotel",
    title: "호텔 안내",
    description: "체크인/체크아웃 시간, 대표 연락처, 기본 이용 정보를 확인합니다.",
    tag: "Essential",
  },
  {
    href: "/dining",
    title: "다이닝",
    description: "조식, 레스토랑, 라운지 운영 시간과 이용 포인트를 빠르게 확인합니다.",
    tag: "Dining",
  },
  {
    href: "/facilities",
    title: "부대시설",
    description: "피트니스, 수영장, 사우나 등 시설별 위치와 이용 조건을 안내합니다.",
    tag: "Wellness",
  },
  {
    href: "/services",
    title: "호텔 서비스",
    description: "컨시어지, 하우스키핑, 객실 서비스 등 요청 가능한 항목을 확인합니다.",
    tag: "Service",
  },
  {
    href: "/transport",
    title: "교통 안내",
    description: "공항, 지하철, 택시 이동 경로와 예상 소요 시간을 안내합니다.",
    tag: "Transit",
  },
  {
    href: "/nearby",
    title: "주변 추천",
    description: "호텔 인근 관광/쇼핑/맛집 장소를 거리순으로 탐색할 수 있습니다.",
    tag: "Curated",
  },
  {
    href: "/emergency",
    title: "응급 안내",
    description: "병원, 약국, 비상 연락처 등 안전 관련 정보를 우선 제공합니다.",
    tag: "Safety",
  },
  {
    href: "/faq",
    title: "FAQ",
    description: "질문을 입력하면 관련된 답변 문장만 추려서 정확하게 안내합니다.",
    tag: "AI Answer",
  },
  {
    href: "/notices",
    title: "공지사항",
    description: "운영 변경, 이벤트, 임시 안내 등 현재 적용 중인 공지를 확인합니다.",
    tag: "Live",
  },
];

export default function KioskHomePage() {
  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Wirye Militopia Hotel</p>
        <h1 className="page-title">프리미엄 로비 컨시어지</h1>
        <p className="page-subtitle">
          호텔 이용 정보와 주변 추천을 한 화면에서 빠르게 안내합니다. 음성으로 질문하면 필요한 답변만
          선별해 보여드리고, 즉시 음성으로 안내해 드립니다.
        </p>
        <div className="hero-meta">
          <span className="hero-chip">24h Voice Concierge</span>
          <span className="hero-chip">Real-time FAQ Chunk Answer</span>
          <span className="hero-chip">Luxury Lobby Experience</span>
        </div>
      </section>

      <section className="category-grid">
        {categories.map((item) => (
          <Link key={item.href} className="category-tile" href={item.href}>
            <span className="chip">{item.tag}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
