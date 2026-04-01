import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type FacilityPayload = {
  items?: Array<{
    facility_id: string;
    facility_name?: string | null;
    facility_type?: string | null;
    floor_location?: string | null;
    description?: string | null;
    fee_note?: string | null;
  }>;
};

export default async function FacilitiesPage() {
  const data = await fetchPublicPath<FacilityPayload>("/facilities");
  const items = data?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Facility Guide</p>
        <h1 className="page-title">부대시설</h1>
        <p className="page-subtitle">
          피트니스, 수영장, 사우나 등 부대시설의 위치와 이용 정보를 안내합니다.
        </p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">현재 제공 가능한 부대시설 정보가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.facility_id}>
            <div className="list-item-head">
              <h3>{item.facility_name ?? item.facility_id}</h3>
              <span className="chip">Facility</span>
            </div>
            <div className="detail-grid">
              <p>
                <strong>분류</strong>
                <span>{item.facility_type ?? "-"}</span>
              </p>
              <p>
                <strong>위치</strong>
                <span>{item.floor_location ?? "-"}</span>
              </p>
              <p>
                <strong>설명</strong>
                <span>{item.description ?? "-"}</span>
              </p>
              <p>
                <strong>요금</strong>
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
