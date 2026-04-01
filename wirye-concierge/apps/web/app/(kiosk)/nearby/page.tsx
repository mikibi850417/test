import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type NearbyPayload = {
  items?: Array<{
    place_id: string;
    name_kr?: string | null;
    category?: string | null;
    subcategory?: string | null;
    distance_m_display?: number | null;
    walk_minutes_display?: number | null;
  }>;
};

export default async function NearbyPage() {
  const data = await fetchPublicPath<NearbyPayload>("/nearby-places?sort=distance&limit=50");
  const items = data?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Nearby Curations</p>
        <h1 className="page-title">주변 추천</h1>
        <p className="page-subtitle">호텔 근처의 관광, 쇼핑, 생활 편의 장소를 안내합니다.</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item">현재 제공 가능한 주변 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.place_id}>
            <h3>{item.name_kr ?? item.place_id}</h3>
            <div className="detail-grid">
              <p>
                <strong>카테고리</strong>
                <span>
                  {item.category ?? "-"} / {item.subcategory ?? "-"}
                </span>
              </p>
              <p>
                <strong>거리</strong>
                <span>
                  {typeof item.distance_m_display === "number"
                    ? `${Math.round(item.distance_m_display)}m`
                    : "-"}
                </span>
              </p>
              <p>
                <strong>도보 소요</strong>
                <span>
                  {typeof item.walk_minutes_display === "number" ? `${item.walk_minutes_display}분` : "-"}
                </span>
              </p>
            </div>
            <Link className="button button-inline" href={`/nearby/${item.place_id}`}>
              상세 보기
            </Link>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
