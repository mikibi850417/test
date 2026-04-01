"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type InboxStatus = "new" | "triage" | "assigned" | "pending_guest" | "resolved";
type InboxPriority = "normal" | "high" | "urgent";

type InboxNote = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

type InboxItem = {
  id: string;
  hotelId: string;
  question: string;
  answer: string;
  route: string;
  provider: "gemini" | "fallback" | "manual";
  reason: string;
  status: InboxStatus;
  priority: InboxPriority;
  assignee: string | null;
  tags: string[];
  notes: InboxNote[];
  createdAt: string;
  updatedAt: string;
};

type InboxResponse = {
  items: InboxItem[];
  summary: {
    total: number;
    open: number;
    new: number;
    assigned: number;
    pendingGuest: number;
    resolved: number;
    urgent: number;
  };
};

const STATUS_OPTIONS: Array<{ value: "all" | "open" | InboxStatus; label: string }> = [
  { value: "open", label: "열린 티켓" },
  { value: "all", label: "전체" },
  { value: "new", label: "신규" },
  { value: "triage", label: "분류중" },
  { value: "assigned", label: "배정됨" },
  { value: "pending_guest", label: "고객 응답 대기" },
  { value: "resolved", label: "해결됨" },
];

const PRIORITY_OPTIONS: InboxPriority[] = ["normal", "high", "urgent"];

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 12);
}

export default function AdminConciergeInboxPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [status, setStatus] = useState<"all" | "open" | InboxStatus>("open");
  const [summary, setSummary] = useState<InboxResponse["summary"] | null>(null);
  const [myEmail, setMyEmail] = useState("");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState<Record<string, string>>({});

  const unresolvedCount = useMemo(
    () => items.filter((item) => item.status !== "resolved").length,
    [items],
  );

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }

      const [me, inboxPayload] = await Promise.all([
        adminFetch<{ email: string }>("/api/v1/admin/me", token),
        fetch(`/api/concierge/inbox?status=${encodeURIComponent(status)}&limit=200`, {
          cache: "no-store",
        }).then(async (res) => {
          if (!res.ok) {
            throw new Error(`인박스 조회 실패 (${res.status})`);
          }
          return (await res.json()) as InboxResponse;
        }),
      ]);

      setMyEmail(me.email);
      setItems(inboxPayload.items);
      setSummary(inboxPayload.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "인박스 로딩 실패");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  async function patchItem(itemId: string, body: Record<string, unknown>) {
    setError(null);
    const response = await fetch(`/api/concierge/inbox/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`업데이트 실패 (${response.status})`);
    }
    await loadInbox();
  }

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Operations Inbox</p>
        <h1 className="page-title">컨시어지 핸드오프 인박스</h1>
        <p className="page-subtitle">
          음성 컨시어지 fallback, 직원 연결 요청, 분류/배정/해결 상태를 한 화면에서 운영합니다.
        </p>
        <div className="hero-meta">
          <span className="hero-chip">Open: {summary?.open ?? unresolvedCount}</span>
          <span className="hero-chip">Urgent: {summary?.urgent ?? 0}</span>
          <span className="hero-chip">My ID: {myEmail || "-"}</span>
        </div>
      </section>

      <section className="card">
        <div className="inbox-toolbar">
          <label>
            상태 필터
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              disabled={loading}
            >
              {STATUS_OPTIONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button-inline button" onClick={() => void loadInbox()} disabled={loading}>
            {loading ? "갱신 중..." : "새로고침"}
          </button>
        </div>
      </section>

      {error ? <div className="list-item">{error}</div> : null}

      <section className="list">
        {items.length === 0 ? (
          <div className="list-item empty-state">현재 조건에 해당하는 인박스 항목이 없습니다.</div>
        ) : null}
        {items.map((item) => (
          <article className="list-item" key={item.id}>
            <div className="list-item-head">
              <h3>{item.question}</h3>
              <span className="chip">{item.priority.toUpperCase()}</span>
            </div>
            <p>{item.answer}</p>
            <div className="detail-grid">
              <p>
                <strong>티켓 ID</strong>
                <span>{item.id}</span>
              </p>
              <p>
                <strong>상태</strong>
                <span>{item.status}</span>
              </p>
              <p>
                <strong>담당자</strong>
                <span>{item.assignee ?? "-"}</span>
              </p>
              <p>
                <strong>Provider</strong>
                <span>{item.provider}</span>
              </p>
              <p>
                <strong>Reason</strong>
                <span>{item.reason}</span>
              </p>
              <p>
                <strong>Route</strong>
                <span>{item.route}</span>
              </p>
              <p>
                <strong>생성</strong>
                <span>{formatDate(item.createdAt)}</span>
              </p>
              <p>
                <strong>수정</strong>
                <span>{formatDate(item.updatedAt)}</span>
              </p>
            </div>

            <div style={{ height: "0.6rem" }} />
            <div className="inbox-action-row">
              <button
                className="button-ghost"
                onClick={() =>
                  void patchItem(item.id, {
                    status: "assigned",
                    assignee: myEmail || item.assignee,
                  })
                }
              >
                나에게 배정
              </button>
              <button
                className="button-ghost"
                onClick={() =>
                  void patchItem(item.id, {
                    status: "triage",
                  })
                }
              >
                분류중
              </button>
              <button
                className="button-ghost"
                onClick={() =>
                  void patchItem(item.id, {
                    status: "pending_guest",
                  })
                }
              >
                고객대기
              </button>
              <button
                className="button-ghost"
                onClick={() =>
                  void patchItem(item.id, {
                    status: "resolved",
                  })
                }
              >
                해결처리
              </button>
            </div>

            <div style={{ height: "0.55rem" }} />
            <div className="inbox-action-row">
              {PRIORITY_OPTIONS.map((entry) => (
                <button
                  key={entry}
                  className="button-ghost"
                  onClick={() =>
                    void patchItem(item.id, {
                      priority: entry,
                    })
                  }
                >
                  우선순위: {entry}
                </button>
              ))}
            </div>

            <div style={{ height: "0.55rem" }} />
            <div className="inbox-note-row">
              <input
                className="input"
                placeholder="태그를 쉼표로 입력 (예: voice,fallback,night)"
                value={tagDraft[item.id] ?? item.tags.join(", ")}
                onChange={(event) =>
                  setTagDraft((prev) => ({
                    ...prev,
                    [item.id]: event.target.value,
                  }))
                }
              />
              <button
                className="button-ghost"
                onClick={() =>
                  void patchItem(item.id, {
                    tags: parseTags(tagDraft[item.id] ?? item.tags.join(", ")),
                  })
                }
              >
                태그 저장
              </button>
            </div>

            <div style={{ height: "0.55rem" }} />
            <div className="inbox-note-row">
              <input
                className="input"
                placeholder="내부 메모를 입력하세요."
                value={noteDraft[item.id] ?? ""}
                onChange={(event) =>
                  setNoteDraft((prev) => ({
                    ...prev,
                    [item.id]: event.target.value,
                  }))
                }
              />
              <button
                className="button-ghost"
                onClick={async () => {
                  const text = (noteDraft[item.id] ?? "").trim();
                  if (!text) {
                    return;
                  }
                  await patchItem(item.id, {
                    note: {
                      text,
                      author: myEmail || "admin",
                    },
                  });
                  setNoteDraft((prev) => ({ ...prev, [item.id]: "" }));
                }}
              >
                메모 저장
              </button>
            </div>

            {item.notes.length > 0 ? (
              <>
                <div style={{ height: "0.55rem" }} />
                <div className="inbox-note-list">
                  {item.notes.slice(-3).map((note) => (
                    <p key={note.id}>
                      <strong>{note.author}</strong> {note.text}{" "}
                      <span className="muted">({formatDate(note.createdAt)})</span>
                    </p>
                  ))}
                </div>
              </>
            ) : null}
          </article>
        ))}
      </section>

      <div style={{ height: "0.8rem" }} />
      <Link className="button-ghost" href="/admin">
        관리자 홈
      </Link>
    </main>
  );
}
