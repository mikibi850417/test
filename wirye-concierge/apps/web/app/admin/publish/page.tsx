"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";
import { DEFAULT_HOTEL_ID } from "@/lib/public-api";

type VersionRow = {
  publish_version_id: string;
  version_no: number;
  status: string;
  published_at?: string | null;
  notes?: string | null;
  snapshot_path?: string | null;
  snapshot_checksum?: string | null;
};

export default function AdminPublishPage() {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [note, setNote] = useState("manual publish");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadVersions() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const data = await adminFetch<VersionRow[]>("/api/v1/admin/publish/versions", token);
      setVersions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "버전 조회 실패");
    }
  }

  useEffect(() => {
    void loadVersions();
  }, []);

  async function onPublish() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    try {
      await adminFetch("/api/v1/admin/publish", token, {
        method: "POST",
        body: JSON.stringify({ hotelId: DEFAULT_HOTEL_ID, note }),
      });
      setError(null);
      await loadVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "발행 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="card">
        <h1>발행 관리</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <div className="card">
        <input className="input" value={note} onChange={(event) => setNote(event.target.value)} />
        <div style={{ height: "0.8rem" }} />
        <button className="button" onClick={() => void onPublish()} disabled={loading}>
          {loading ? "발행 중..." : "발행 실행"}
        </button>
      </div>

      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}
      <div className="list">
        {versions.map((row) => (
          <div className="list-item" key={row.publish_version_id}>
            <h3>v{row.version_no}</h3>
            <p>상태: {row.status}</p>
            <p>발행시각: {row.published_at ?? "-"}</p>
            <p>노트: {row.notes ?? "-"}</p>
            <p>Snapshot: {row.snapshot_path ?? "-"}</p>
            <p>Checksum: {row.snapshot_checksum ?? "-"}</p>
          </div>
        ))}
      </div>

      <div style={{ height: "0.8rem" }} />
      <Link className="button-ghost" href="/admin">
        관리자 홈
      </Link>
    </main>
  );
}
