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
      <div className="card">
        <h1>교통 / 오시는 길</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.transport_id}>
            <h3>{item.origin_name ?? item.transport_id}</h3>
            <p>수단: {item.transport_mode ?? "-"}</p>
            <p>예상 소요: {item.duration_min ? `${item.duration_min}분` : "-"}</p>
            <p>요금/메모: {item.fare_note ?? "-"}</p>
            <p>{item.route_detail ?? "-"}</p>
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
