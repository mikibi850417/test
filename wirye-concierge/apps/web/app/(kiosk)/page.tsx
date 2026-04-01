import Link from "next/link";

const categories = [
  {
    href: "/hotel",
    title: "호텔 안내",
    description: "체크인/체크아웃, 연락처, 기본 운영 정보를 확인합니다.",
  },
  {
    href: "/dining",
    title: "식음 안내",
    description: "조식, 레스토랑, 카페 정보를 빠르게 안내합니다.",
  },
  {
    href: "/facilities",
    title: "부대시설",
    description: "피트니스, 수영장, 사우나, 골프 시설 정보를 제공합니다.",
  },
  {
    href: "/services",
    title: "호텔 서비스",
    description: "주차, 수하물 보관, 고객 편의 서비스 이용 정보를 봅니다.",
  },
  {
    href: "/transport",
    title: "교통/이동",
    description: "공항, 지하철, 버스 이동 경로와 추천 교통편을 확인합니다.",
  },
  {
    href: "/nearby",
    title: "주변 추천",
    description: "가족, 관광, 쇼핑, 약국 등 주변 주요 장소를 탐색합니다.",
  },
  {
    href: "/emergency",
    title: "응급 안내",
    description: "응급실, 약국, 비상 연락처를 신속하게 확인합니다.",
  },
  {
    href: "/faq",
    title: "FAQ",
    description: "자주 묻는 질문에 대한 즉시 답변을 확인합니다.",
  },
  {
    href: "/notices",
    title: "공지사항",
    description: "운영 변경, 임시 안내, 중요 공지 정보를 제공합니다.",
  },
];

export default function KioskHomePage() {
  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Wirye Militopia Hotel</p>
        <h1 className="page-title">프리미엄 컨시어지 키오스크</h1>
        <p className="page-subtitle">
          음성으로 질문하고 즉시 답변을 받으세요. 화면 터치 없이도 필요한 호텔 정보를 정확하게
          안내해 드립니다.
        </p>
      </section>

      <section className="category-grid">
        {categories.map((item) => (
          <Link key={item.href} className="category-tile" href={item.href}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
