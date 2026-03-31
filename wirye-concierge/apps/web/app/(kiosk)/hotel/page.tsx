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
      <div className="card">
        <h1>호텔 안내</h1>
        <p className="subtext">기본 정보는 승인된 공개 데이터만 표시됩니다.</p>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        <div className="list-item">
          <h3>{hotel?.name_kr ?? "정보 없음"}</h3>
          <p className="muted">{hotel?.name_en ?? "-"}</p>
          <p>주소: {hotel?.address ?? "-"}</p>
          <p>대표번호: {hotel?.phone ?? "-"}</p>
          <p>체크인: {hotel?.check_in_time ?? "-"}</p>
          <p>체크아웃: {hotel?.check_out_time ?? "-"}</p>
        </div>
      </div>

      <div style={{ height: "0.8rem" }} />
      <Link className="button" href="/">
        홈으로
      </Link>
    </main>
  );
}
