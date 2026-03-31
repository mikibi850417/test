import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type FacilityPayload = {
  items?: Array<{
    facility_id: string;
    facility_name?: string | null;
    facility_type?: string | null;
    floor_location?: string | null;
    description?: string | null;
  }>;
};

export default async function FacilitiesPage() {
  const data = await fetchPublicPath<FacilityPayload>("/facilities");
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>부대시설</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.facility_id}>
            <h3>{item.facility_name ?? item.facility_id}</h3>
            <p>유형: {item.facility_type ?? "-"}</p>
            <p>위치: {item.floor_location ?? "-"}</p>
            <p>{item.description ?? "-"}</p>
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
