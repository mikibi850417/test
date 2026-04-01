import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type HomePayload = {
  hotel?: {
    name_kr?: string;
    name_en?: string | null;
    address?: string | null;
    phone?: string | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
  };
};

export default async function HotelPage() {
  const data = await fetchPublicPath<HomePayload>("/home");
  const hotel = data?.hotel;

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Hotel Information</p>
        <h1 className="page-title">호텔 안내</h1>
        <p className="page-subtitle">기본 정보, 연락처, 체크인/체크아웃 시간을 안내합니다.</p>
      </section>

      <section className="list">
        <article className="list-item">
          <h3>{hotel?.name_kr ?? "호텔 정보가 없습니다."}</h3>
          <p className="muted">{hotel?.name_en ?? "-"}</p>
          <div className="detail-grid">
            <p>
              <strong>주소</strong>
              <span>{hotel?.address ?? "-"}</span>
            </p>
            <p>
              <strong>대표번호</strong>
              <span>{hotel?.phone ?? "-"}</span>
            </p>
            <p>
              <strong>체크인</strong>
              <span>{hotel?.check_in_time ?? "-"}</span>
            </p>
            <p>
              <strong>체크아웃</strong>
              <span>{hotel?.check_out_time ?? "-"}</span>
            </p>
          </div>
        </article>
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
