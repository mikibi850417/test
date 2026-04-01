import { NextRequest, NextResponse } from "next/server";

import { buildConciergeResponse } from "@/lib/concierge-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  question?: string;
};

export async function POST(request: NextRequest) {
  let payload: ChatRequest;
  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ detail: "invalid json body" }, { status: 400 });
  }

  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  if (!question) {
    return NextResponse.json({ detail: "question is required" }, { status: 400 });
  }

  const result = await buildConciergeResponse(question);
  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
