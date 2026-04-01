import Link from "next/link";

import { fetchPublicPath } from "@/lib/public-api";

type DetailPayload = {
  item?: {
    place_id: string;
    name_kr?: string | null;
    category?: string | null;
    subcategory?: string | null;
    short_desc?: string | null;
    address?: string | null;
    walk_time_min?: number | null;
    drive_time_min?: number | null;
    transit_time_min?: number | null;
  };
};

type RoutePayload = {
  items?: Array<{
    route_id: string;
    transport_mode?: string | null;
    estimated_duration_min?: number | null;
    steps?: string[];
  }>;
};

export default async function NearbyDetailPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const detail = await fetchPublicPath<DetailPayload>(`/nearby-places/${placeId}`);
  const routes = await fetchPublicPath<RoutePayload>(`/routes/${placeId}`);
  const item = detail?.item;
  const routeItems = routes?.items ?? [];

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Nearby Detail</p>
        <h1 className="page-title">{item?.name_kr ?? placeId}</h1>
        <p className="page-subtitle">
          {item?.category ?? "-"} / {item?.subcategory ?? "-"}
        </p>
      </section>

      <section className="list">
        <article className="list-item">
          <div className="list-item-head">
            <h3>장소 정보</h3>
            <span className="chip">Detail</span>
          </div>
          <div className="detail-grid">
            <p>
              <strong>간단소개</strong>
              <span>{item?.short_desc ?? "-"}</span>
            </p>
            <p>
              <strong>주소</strong>
              <span>{item?.address ?? "-"}</span>
            </p>
            <p>
              <strong>도보</strong>
              <span>{typeof item?.walk_time_min === "number" ? `${item.walk_time_min}분` : "-"}</span>
            </p>
            <p>
              <strong>차량</strong>
              <span>{typeof item?.drive_time_min === "number" ? `${item.drive_time_min}분` : "-"}</span>
            </p>
            <p>
              <strong>대중교통</strong>
              <span>{typeof item?.transit_time_min === "number" ? `${item.transit_time_min}분` : "-"}</span>
            </p>
          </div>
        </article>

        {routeItems.length === 0 ? (
          <article className="list-item empty-state">등록된 이동 경로 정보가 없습니다.</article>
        ) : null}

        {routeItems.map((route) => (
          <article className="list-item" key={route.route_id}>
            <div className="list-item-head">
              <h3>{route.transport_mode ?? "이동 경로"}</h3>
              <span className="chip">Route</span>
            </div>
            <p className="muted">
              예상 소요:{" "}
              {typeof route.estimated_duration_min === "number" ? `${route.estimated_duration_min}분` : "-"}
            </p>
            <ol className="step-list">
              {(route.steps ?? []).map((step, index) => (
                <li key={`${route.route_id}_${index}`}>{step}</li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/nearby">
        주변 목록으로
      </Link>
    </main>
  );
}
