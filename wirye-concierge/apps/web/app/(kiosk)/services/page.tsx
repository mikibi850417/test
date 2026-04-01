import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type ServicePayload = {
  items?: Array<{
    service_id: string;
    service_name?: string | null;
    service_category?: string | null;
    service_hours?: string | null;
    phone?: string | null;
    fee_note?: string | null;
  }>;
};

export default async function ServicesPage() {
  const data = await fetchPublicPath<ServicePayload>("/services");
  const items = data?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Guest Services</p>
        <h1 className="page-title">호텔 서비스</h1>
        <p className="page-subtitle">투숙객 편의 서비스와 운영 시간을 안내합니다.</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item">현재 제공 가능한 서비스 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.service_id}>
            <h3>{item.service_name ?? item.service_id}</h3>
            <div className="detail-grid">
              <p>
                <strong>분류</strong>
                <span>{item.service_category ?? "-"}</span>
              </p>
              <p>
                <strong>운영시간</strong>
                <span>{item.service_hours ?? "-"}</span>
              </p>
              <p>
                <strong>연락처</strong>
                <span>{item.phone ?? "-"}</span>
              </p>
              <p>
                <strong>요금 안내</strong>
                <span>{item.fee_note ?? "-"}</span>
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
