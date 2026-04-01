import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

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

type NoticeItem = {
  notice_id: string;
  title?: string | null;
  body?: string | null;
};

type DiningItem = {
  dining_id: string;
  venue_name_kr?: string | null;
  hours_mon?: string | null;
};

type NearbyItem = {
  place_id: string;
  name_kr?: string | null;
  walk_minutes_display?: number | null;
};

type EmergencyItem = {
  emergency_id: string;
  contact_name?: string | null;
  phone?: string | null;
};

type ListPayload<T> = {
  items?: T[];
};

export default async function KioskHomePage() {
  const [noticesPayload, diningPayload, nearbyPayload, emergencyPayload] = await Promise.all([
    fetchPublicPath<ListPayload<NoticeItem>>("/notices"),
    fetchPublicPath<ListPayload<DiningItem>>("/dining"),
    fetchPublicPath<ListPayload<NearbyItem>>("/nearby-places"),
    fetchPublicPath<ListPayload<EmergencyItem>>("/emergency"),
  ]);

  const notices = (noticesPayload?.items ?? []).slice(0, 2);
  const dining = (diningPayload?.items ?? []).slice(0, 3);
  const nearby = (nearbyPayload?.items ?? []).slice(0, 3);
  const emergency = (emergencyPayload?.items ?? []).slice(0, 2);

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

      <section className="lobby-module-grid">
        <article className="list-item">
          <div className="list-item-head">
            <h3>실시간 공지</h3>
            <span className="chip">Live</span>
          </div>
          {notices.length === 0 ? <p className="muted">현재 공지사항이 없습니다.</p> : null}
          {notices.map((item) => (
            <p key={item.notice_id}>
              <strong>{item.title ?? item.notice_id}</strong>
              {item.body ? ` - ${item.body}` : ""}
            </p>
          ))}
          <Link className="button-inline button-ghost" href="/notices">
            공지 전체 보기
          </Link>
        </article>

        <article className="list-item">
          <div className="list-item-head">
            <h3>오늘의 다이닝</h3>
            <span className="chip">Dining</span>
          </div>
          {dining.length === 0 ? <p className="muted">등록된 다이닝 정보가 없습니다.</p> : null}
          {dining.map((item) => (
            <p key={item.dining_id}>
              <strong>{item.venue_name_kr ?? item.dining_id}</strong>
              {item.hours_mon ? ` - ${item.hours_mon}` : ""}
            </p>
          ))}
          <Link className="button-inline button-ghost" href="/dining">
            다이닝 보기
          </Link>
        </article>

        <article className="list-item">
          <div className="list-item-head">
            <h3>도보 추천 장소</h3>
            <span className="chip">Nearby</span>
          </div>
          {nearby.length === 0 ? <p className="muted">주변 추천 데이터가 없습니다.</p> : null}
          {nearby.map((item) => (
            <p key={item.place_id}>
              <strong>{item.name_kr ?? item.place_id}</strong>
              {item.walk_minutes_display ? ` - 도보 ${item.walk_minutes_display}분` : ""}
            </p>
          ))}
          <Link className="button-inline button-ghost" href="/nearby">
            주변 추천 보기
          </Link>
        </article>

        <article className="list-item">
          <div className="list-item-head">
            <h3>응급 연락처</h3>
            <span className="chip">Safety</span>
          </div>
          {emergency.length === 0 ? <p className="muted">응급 연락처 정보가 없습니다.</p> : null}
          {emergency.map((item) => (
            <p key={item.emergency_id}>
              <strong>{item.contact_name ?? item.emergency_id}</strong>
              {item.phone ? ` - ${item.phone}` : ""}
            </p>
          ))}
          <Link className="button-inline button-ghost" href="/emergency">
            응급 안내 보기
          </Link>
        </article>
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
