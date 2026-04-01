import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type TransportPayload = {
  items?: Array<{
    transport_id: string;
    origin_name?: string | null;
    transport_mode?: string | null;
    duration_min?: number | null;
    fare_note?: string | null;
    route_detail?: string | null;
  }>;
};

export default async function TransportPage() {
  const data = await fetchPublicPath<TransportPayload>("/transport");
  const items = data?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Transportation</p>
        <h1 className="page-title">교통 안내</h1>
        <p className="page-subtitle">
          공항, 지하철, 버스, 택시 이동 경로와 예상 소요 시간을 확인하실 수 있습니다.
        </p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">현재 제공 가능한 교통 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.transport_id}>
            <div className="list-item-head">
              <h3>{item.origin_name ?? item.transport_id}</h3>
              <span className="chip">Route</span>
            </div>
            <div className="detail-grid">
              <p>
                <strong>이동수단</strong>
                <span>{item.transport_mode ?? "-"}</span>
              </p>
              <p>
                <strong>예상시간</strong>
                <span>{typeof item.duration_min === "number" ? `${item.duration_min}분` : "-"}</span>
              </p>
              <p>
                <strong>요금/메모</strong>
                <span>{item.fare_note ?? "-"}</span>
              </p>
              <p>
                <strong>경로안내</strong>
                <span>{item.route_detail ?? "-"}</span>
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
