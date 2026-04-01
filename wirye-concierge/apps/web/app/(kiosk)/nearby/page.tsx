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
        <p className="page-subtitle">
          호텔 근처 관광, 쇼핑, 맛집 장소를 거리 기준으로 빠르게 확인해 보세요.
        </p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">현재 제공 가능한 주변 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.place_id}>
            <div className="list-item-head">
              <h3>{item.name_kr ?? item.place_id}</h3>
              <span className="chip">Nearby</span>
            </div>
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
                <strong>도보시간</strong>
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
