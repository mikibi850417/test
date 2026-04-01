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
      <section className="card card-hero">
        <p className="eyebrow">Emergency & Safety</p>
        <h1 className="page-title">응급 안내</h1>
        <p className="page-subtitle">응급 연락처와 가까운 의료 시설 정보를 확인합니다.</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item">현재 제공 가능한 응급 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.emergency_id}>
            <h3>{item.contact_name ?? item.emergency_id}</h3>
            <div className="detail-grid">
              <p>
                <strong>분류</strong>
                <span>{item.category ?? "-"}</span>
              </p>
              <p>
                <strong>전화</strong>
                <span>{item.phone ?? "-"}</span>
              </p>
              <p>
                <strong>차량 소요</strong>
                <span>{typeof item.drive_time_min === "number" ? `${item.drive_time_min}분` : "-"}</span>
              </p>
              <p>
                <strong>24시간 운영</strong>
                <span>{item.available_24h_yn ? "가능" : "확인 필요"}</span>
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
