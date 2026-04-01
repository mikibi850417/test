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
      <section className="card card-hero">
        <p className="eyebrow">Live Notices</p>
        <h1 className="page-title">공지사항</h1>
        <p className="page-subtitle">운영 변경 및 임시 안내를 실시간으로 확인하실 수 있습니다.</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">현재 적용 중인 공지사항이 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.notice_id}>
            <div className="list-item-head">
              <h3>{item.title ?? item.notice_id}</h3>
              <span className="chip">{item.impact_level ?? "Notice"}</span>
            </div>
            <p>{item.body ?? "-"}</p>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
