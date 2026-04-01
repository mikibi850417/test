import { NextRequest, NextResponse } from "next/server";

import {
  ConciergeInboxPriority,
  ConciergeInboxStatus,
  createInboxItem,
  getInboxSummary,
  listInboxItems,
} from "@/lib/concierge-inbox-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateRequest = {
  hotelId?: string;
  question?: string;
  answer?: string;
  route?: string;
  provider?: "gemini" | "fallback" | "manual";
  reason?: string;
  status?: ConciergeInboxStatus;
  priority?: ConciergeInboxPriority;
  assignee?: string | null;
  tags?: string[];
  note?: {
    text?: string;
    author?: string;
  };
};

function toStatus(value: string | null): ConciergeInboxStatus | "open" | "all" {
  if (!value) {
    return "all";
  }
  const normalized = value.trim().toLowerCase();
  const allowed = new Set([
    "all",
    "open",
    "new",
    "triage",
    "assigned",
    "pending_guest",
    "resolved",
  ]);
  if (allowed.has(normalized)) {
    return normalized as ConciergeInboxStatus | "open" | "all";
  }
  return "all";
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const status = toStatus(search.get("status"));
  const limit = Number(search.get("limit") ?? "200");
  const query = search.get("q") ?? "";

  const [items, summary] = await Promise.all([
    listInboxItems({ status, limit, query }),
    getInboxSummary(),
  ]);

  return NextResponse.json(
    {
      items,
      summary,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  let payload: CreateRequest;
  try {
    payload = (await request.json()) as CreateRequest;
  } catch {
    return NextResponse.json({ detail: "invalid json body" }, { status: 400 });
  }

  const question = payload.question?.trim() ?? "";
  const answer = payload.answer?.trim() ?? "";
  const reason = payload.reason?.trim() ?? "";

  if (!question) {
    return NextResponse.json({ detail: "question is required" }, { status: 400 });
  }
  if (!answer) {
    return NextResponse.json({ detail: "answer is required" }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ detail: "reason is required" }, { status: 400 });
  }

  const item = await createInboxItem({
    hotelId: payload.hotelId,
    question,
    answer,
    route: payload.route,
    provider: payload.provider,
    reason,
    status: payload.status,
    priority: payload.priority,
    assignee: payload.assignee,
    tags: payload.tags,
    note: payload.note?.text
      ? {
          text: payload.note.text,
          author: payload.note.author,
        }
      : undefined,
  });

  return NextResponse.json(item, { status: 201 });
}
