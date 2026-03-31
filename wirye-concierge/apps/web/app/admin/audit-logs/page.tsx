"use client";

import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type AuditRow = {
  audit_id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  created_at: string;
};

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      try {
        const data = await adminFetch<AuditRow[]>("/api/v1/admin/audit-logs", token);
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "조회 실패");
      }
    }
    void load();
  }, []);

  return (
    <main>
      <div className="card">
        <h1>감사로그</h1>
      </div>
      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}

      <div className="list">
        {rows.length === 0 ? <div className="list-item">로그가 없습니다.</div> : null}
        {rows.map((row) => (
          <div className="list-item" key={row.audit_id}>
            <h3>{row.action}</h3>
            <p>
              {row.actor} / {row.entity_type} / {row.entity_id ?? "-"}
            </p>
            <p className="muted">{row.created_at}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
