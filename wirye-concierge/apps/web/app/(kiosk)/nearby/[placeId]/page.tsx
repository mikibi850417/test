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
      <div className="card">
        <h1>{item?.name_kr ?? placeId}</h1>
        <p className="subtext">
          {item?.category ?? "-"} / {item?.subcategory ?? "-"}
        </p>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="list">
        <div className="list-item">
          <p>{item?.short_desc ?? "-"}</p>
          <p>주소: {item?.address ?? "-"}</p>
          <p>도보: {item?.walk_time_min ? `${item.walk_time_min}분` : "-"}</p>
          <p>차량: {item?.drive_time_min ? `${item.drive_time_min}분` : "-"}</p>
          <p>대중교통: {item?.transit_time_min ? `${item.transit_time_min}분` : "-"}</p>
        </div>

        {(routes?.items ?? []).map((route) => (
          <div className="list-item" key={route.route_id}>
            <h3>{route.transport_mode ?? "route"}</h3>
            <p>예상 소요: {route.estimated_duration_min ? `${route.estimated_duration_min}분` : "-"}</p>
            <div className="list">
              {(route.steps ?? []).map((step, index) => (
                <p key={`${route.route_id}_${index}`}>{`${index + 1}. ${step}`}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: "0.8rem" }} />
      <Link className="button" href="/nearby">
        주변 목록으로
      </Link>
    </main>
  );
}
