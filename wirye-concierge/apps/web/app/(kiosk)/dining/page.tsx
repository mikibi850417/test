import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type DiningPayload = {
  items?: Array<{
    dining_id: string;
    venue_name_kr?: string | null;
    floor_location?: string | null;
    operating_hours?: string | null;
    price_info?: string | null;
  }>;
};

export default async function DiningPage() {
  const data = await fetchPublicPath<DiningPayload>("/dining");
  const items = data?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Dining & Lounge</p>
        <h1 className="page-title">다이닝 안내</h1>
        <p className="page-subtitle">
          조식, 레스토랑, 라운지 운영 시간과 위치, 요금 정보를 확인해 보세요.
        </p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">현재 제공 가능한 다이닝 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.dining_id}>
            <div className="list-item-head">
              <h3>{item.venue_name_kr ?? item.dining_id}</h3>
              <span className="chip">Dining</span>
            </div>
            <div className="detail-grid">
              <p>
                <strong>위치</strong>
                <span>{item.floor_location ?? "-"}</span>
              </p>
              <p>
                <strong>운영시간</strong>
                <span>{item.operating_hours ?? "-"}</span>
              </p>
              <p>
                <strong>요금안내</strong>
                <span>{item.price_info ?? "-"}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
