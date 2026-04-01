import { NextRequest, NextResponse } from "next/server";

import {
  ConciergeInboxPriority,
  ConciergeInboxStatus,
  updateInboxItem,
} from "@/lib/concierge-inbox-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateRequest = {
  status?: ConciergeInboxStatus;
  priority?: ConciergeInboxPriority;
  assignee?: string | null;
  tags?: string[];
  note?: {
    text?: string;
    author?: string;
  };
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const itemId = params?.id?.trim();
  if (!itemId) {
    return NextResponse.json({ detail: "id is required" }, { status: 400 });
  }

  let payload: UpdateRequest;
  try {
    payload = (await request.json()) as UpdateRequest;
  } catch {
    return NextResponse.json({ detail: "invalid json body" }, { status: 400 });
  }

  const item = await updateInboxItem(itemId, {
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

  if (!item) {
    return NextResponse.json({ detail: "inbox item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}
