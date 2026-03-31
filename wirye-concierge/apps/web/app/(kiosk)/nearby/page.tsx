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
      <div className="card">
        <h1>주변 인프라</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.place_id}>
            <h3>{item.name_kr ?? item.place_id}</h3>
            <p>
              {item.category ?? "-"} / {item.subcategory ?? "-"}
            </p>
            <p>
              거리:{" "}
              {typeof item.distance_m_display === "number"
                ? `${Math.round(item.distance_m_display)}m`
                : "-"}
            </p>
            <p>도보: {item.walk_minutes_display ? `${item.walk_minutes_display}분` : "-"}</p>
            <Link className="button" href={`/nearby/${item.place_id}`}>
              상세 보기
            </Link>
          </div>
        ))}
      </div>

      <div style={{ height: "0.8rem" }} />
      <Link className="button" href="/">
        홈으로
      </Link>
    </main>
  );
}
