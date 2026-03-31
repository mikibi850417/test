import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type EmergencyPayload = {
  items?: Array<{
    emergency_id: string;
    contact_name?: string | null;
    category?: string | null;
    phone?: string | null;
    drive_time_min?: number | null;
    available_24h_yn?: boolean | null;
  }>;
};

export default async function EmergencyPage() {
  const data = await fetchPublicPath<EmergencyPayload>("/emergency");
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>응급 안내</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.emergency_id}>
            <h3>{item.contact_name ?? item.emergency_id}</h3>
            <p>분류: {item.category ?? "-"}</p>
            <p>전화: {item.phone ?? "-"}</p>
            <p>차량 소요: {item.drive_time_min ? `${item.drive_time_min}분` : "-"}</p>
            <p>24시간: {item.available_24h_yn ? "예" : "아니오/미확인"}</p>
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
