"use client";

import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type ConflictRow = {
  conflict_id: string;
  entity_type: string;
  field_name: string;
  value_a?: string | null;
  value_b?: string | null;
  status: string;
};

export default function AdminConflictsPage() {
  const [rows, setRows] = useState<ConflictRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const data = await adminFetch<ConflictRow[]>("/api/v1/admin/conflicts", token);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 실패");
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function resolveConflict(conflictId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;
    try {
      await adminFetch(`/api/v1/admin/conflicts/${conflictId}/resolve`, token, {
        method: "PATCH",
        body: JSON.stringify({
          resolution: "operator_resolved",
          resolvedValue: "manual_resolved",
          note: "웹 콘솔에서 해결",
        }),
      });
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "해결 실패");
    }
  }

  return (
    <main>
      <div className="card">
        <h1>충돌값 관리</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      {error ? <div className="list-item">{error}</div> : null}
      <div className="list">
        {rows.map((row) => (
          <div className="list-item" key={row.conflict_id}>
            <h3>{row.conflict_id}</h3>
            <p>
              {row.entity_type} / {row.field_name}
            </p>
            <p>A: {row.value_a ?? "-"}</p>
            <p>B: {row.value_b ?? "-"}</p>
            <p>상태: {row.status}</p>
            {row.status === "open" ? (
              <button className="button" onClick={() => void resolveConflict(row.conflict_id)}>
                해결 처리
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
