import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type FaqPayload = {
  items?: Array<{
    intent_id: string;
    question_example_ko?: string | null;
    answer_template_ko?: string | null;
  }>;
};

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "체크아웃";
  const data = await fetchPublicPath<FaqPayload>(`/faq/search?q=${encodeURIComponent(query)}`);
  const items = data?.items ?? [];

  return (
    <main>
      <div className="card">
        <h1>FAQ</h1>
        <p className="subtext">검색어: {query}</p>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        {items.length === 0 ? <div className="list-item">검색 결과가 없습니다.</div> : null}
        {items.map((item) => (
          <div className="list-item" key={item.intent_id}>
            <h3>{item.question_example_ko ?? item.intent_id}</h3>
            <p>{item.answer_template_ko ?? "-"}</p>
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
