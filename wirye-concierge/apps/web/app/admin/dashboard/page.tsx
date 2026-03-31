"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type DashboardState = {
  email: string;
  conflicts: number;
  publishes: number;
  devices: number;
  imports: number;
};

export default function AdminDashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      try {
        const [me, conflicts, publishes, devices, imports] = await Promise.all([
          adminFetch<{ email: string }>("/api/v1/admin/me", token),
          adminFetch<Array<unknown>>("/api/v1/admin/conflicts", token),
          adminFetch<Array<unknown>>("/api/v1/admin/publish/versions", token),
          adminFetch<Array<unknown>>("/api/v1/admin/devices", token),
          adminFetch<Array<unknown>>("/api/v1/admin/imports", token),
        ]);
        setState({
          email: me.email,
          conflicts: conflicts.length,
          publishes: publishes.length,
          devices: devices.length,
          imports: imports.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "대시보드 로딩 실패");
      }
    }
    void load();
  }, []);

  return (
    <main>
      <div className="card">
        <h1>관리자 대시보드</h1>
        <p className="subtext">현재 운영 현황 요약입니다.</p>
      </div>
      <div style={{ height: "0.8rem" }} />

      {error ? <div className="list-item">{error}</div> : null}
      {state ? (
        <div className="grid">
          <div className="list-item">
            <h3>로그인 계정</h3>
            <p>{state.email}</p>
          </div>
          <div className="list-item">
            <h3>Open Conflicts</h3>
            <p>{state.conflicts}</p>
          </div>
          <div className="list-item">
            <h3>Publish Versions</h3>
            <p>{state.publishes}</p>
          </div>
          <div className="list-item">
            <h3>Devices</h3>
            <p>{state.devices}</p>
          </div>
          <div className="list-item">
            <h3>Import Jobs</h3>
            <p>{state.imports}</p>
          </div>
        </div>
      ) : null}

      <div style={{ height: "0.8rem" }} />
      <Link className="button-ghost" href="/admin">
        관리자 홈
      </Link>
    </main>
  );
}
