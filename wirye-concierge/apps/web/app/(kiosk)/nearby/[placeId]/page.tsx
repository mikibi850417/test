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
          <div className="detail-grid">
            <p>
              <strong>간단 소개</strong>
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

        {(routes?.items ?? []).map((route) => (
          <article className="list-item" key={route.route_id}>
            <h3>{route.transport_mode ?? "경로 안내"}</h3>
            <p className="muted">
              예상 소요:{" "}
              {typeof route.estimated_duration_min === "number"
                ? `${route.estimated_duration_min}분`
                : "-"}
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
