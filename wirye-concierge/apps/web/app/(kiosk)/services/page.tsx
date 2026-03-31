import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type ServicePayload = {
  items?: Array<{
    service_id: string;
    service_name?: string | null;
    service_category?: string | null;
    service_hours?: string | null;
    phone?: string | null;
  }>;
};

export default async function ServicesPage() {
  const data = await fetchPublicPath<ServicePayload>("/services");
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>호텔 서비스</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.service_id}>
            <h3>{item.service_name ?? item.service_id}</h3>
            <p>분류: {item.service_category ?? "-"}</p>
            <p>운영시간: {item.service_hours ?? "-"}</p>
            <p>문의: {item.phone ?? "-"}</p>
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
