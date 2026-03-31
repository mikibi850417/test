"use client";

import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type DeviceRow = {
  device_id: string;
  device_name?: string | null;
  status: string;
  app_version?: string | null;
  content_version?: string | null;
  last_seen_at?: string | null;
};

export default function AdminDevicesPage() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      try {
        const data = await adminFetch<DeviceRow[]>("/api/v1/admin/devices", token);
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
        <h1>장치 현황</h1>
      </div>
      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}

      <div className="list">
        {rows.length === 0 ? <div className="list-item">등록된 장치가 없습니다.</div> : null}
        {rows.map((row) => (
          <div className="list-item" key={row.device_id}>
            <h3>{row.device_name ?? row.device_id}</h3>
            <p>상태: {row.status}</p>
            <p>앱 버전: {row.app_version ?? "-"}</p>
            <p>콘텐츠 버전: {row.content_version ?? "-"}</p>
            <p>최근 접속: {row.last_seen_at ?? "-"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
