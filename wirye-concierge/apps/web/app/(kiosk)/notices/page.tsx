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
        <p className="page-subtitle">운영 변경 및 임시 공지 내용을 확인합니다.</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item">현재 적용 중인 공지사항이 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.notice_id}>
            <h3>{item.title ?? item.notice_id}</h3>
            <p>{item.body ?? "-"}</p>
            <p className="muted">중요도: {item.impact_level ?? "-"}</p>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
