import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type DiningPayload = {
  items?: Array<{
    dining_id: string;
    venue_name_kr?: string | null;
    operating_hours?: string | null;
    price_info?: string | null;
  }>;
};

export default async function DiningPage() {
  const data = await fetchPublicPath<DiningPayload>("/dining");
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>식음 안내</h1>
        <p className="subtext">레스토랑/조식 정보를 확인하세요.</p>
      </div>

      <div style={{ height: "0.8rem" }} />
      <div className="list">
        {items.length === 0 ? <div className="list-item">표시할 데이터가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.dining_id}>
            <h3>{item.venue_name_kr ?? item.dining_id}</h3>
            <p>운영시간: {item.operating_hours ?? "-"}</p>
            <p>요금: {item.price_info ?? "-"}</p>
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
