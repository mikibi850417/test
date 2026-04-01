import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildTargetUrl(request: NextRequest, hotelId: string, segments: string[]): string {
  const segmentPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
  const suffix = segmentPath.length > 0 ? `/${segmentPath}` : "";
  return `${normalizeBase(BACKEND_BASE)}/api/v1/public/hotels/${encodeURIComponent(hotelId)}${suffix}${request.nextUrl.search}`;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ hotelId: string; segments: string[] }>;
  },
) {
  const params = await context.params;
  const hotelId = params?.hotelId;
  const segments = Array.isArray(params?.segments) ? params.segments : [];

  if (!hotelId) {
    return NextResponse.json({ detail: "hotel_id is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(buildTargetUrl(request, hotelId, segments), {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "public data proxy failed. backend API is unavailable." },
      { status: 502 },
    );
  }
}
