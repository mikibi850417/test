import { NextRequest, NextResponse } from "next/server";

import { buildConciergeResponse } from "@/lib/concierge-chat";
import { createInboxItem } from "@/lib/concierge-inbox-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  question?: string;
};

const DEFAULT_HOTEL_ID =
  process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID ?? "HOTEL_WIRYE_MILITOPIA_001";

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
  if (result.handoff.requested) {
    try {
      const item = await createInboxItem({
        hotelId: DEFAULT_HOTEL_ID,
        question,
        answer: result.reply,
        route: result.route,
        provider: result.provider,
        reason: result.handoff.reason ?? "handoff_requested",
        status: "new",
        priority: result.intent.action === "emergency" ? "urgent" : "high",
        tags: [result.intent.action, "voice-concierge", result.provider],
        note: {
          text: `자동 핸드오프 생성 (${result.provider})`,
          author: "system",
        },
      });
      result.handoff.itemId = item.id;
    } catch {
      // inbox 기록 실패 시에도 대화 응답은 정상 반환한다.
    }
  }
  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
