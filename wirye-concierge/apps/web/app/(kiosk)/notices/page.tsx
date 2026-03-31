import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type NoticesPayload = {
  items?: Array<{
    notice_id: string;
    title?: string | null;
    body?: string | null;
    impact_level?: string | null;
  }>;
};

export default async function NoticesPage() {
  const data = await fetchPublicPath<NoticesPayload>("/notices");
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>공지</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">현재 공지사항이 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.notice_id}>
            <h3>{item.title ?? item.notice_id}</h3>
            <p>{item.body ?? "-"}</p>
            <p className="muted">중요도: {item.impact_level ?? "-"}</p>
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
