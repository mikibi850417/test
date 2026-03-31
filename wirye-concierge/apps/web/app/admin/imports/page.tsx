"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";

type RunSummary = {
  job_run_id: string;
  run_status: string;
  rows_total: number;
  rows_succeeded: number;
  rows_failed: number;
  error_summary?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

type ImportJob = {
  import_job_id: string;
  file_name: string;
  status: string;
  source_type: string;
  created_at: string;
  latest_run: RunSummary | null;
};

type ImportReport = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  table_counts: Record<string, number>;
  rows_total: number;
  file_hash: string | null;
  file_size_bytes: number;
};

type ReportResponse = {
  import_job_id: string;
  file_name: string;
  file_path: string;
  status: string;
  latest_run: RunSummary | null;
  report: ImportReport;
};

export default function AdminImportsPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function loadJobs() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const data = await adminFetch<ImportJob[]>("/api/v1/admin/imports", token);
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import 목록 조회 실패");
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function onUpload() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!selectedFile) {
      setError("업로드할 파일을 선택해주세요.");
      return;
    }

    setWorking(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploaded = await adminFetch<{ import_job_id: string }>(
        "/api/v1/admin/imports",
        token,
        { method: "POST", body: formData },
      );
      setSelectedFile(null);
      setSelectedJobId(uploaded.import_job_id);
      await loadJobs();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일 업로드 실패");
    } finally {
      setWorking(false);
    }
  }

  async function loadReport(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    setWorking(true);
    try {
      const report = await adminFetch<ReportResponse>(
        `/api/v1/admin/imports/${importJobId}/report`,
        token,
      );
      setSelectedJobId(importJobId);
      setSelectedReport(report);
      setError(null);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리포트 조회 실패");
    } finally {
      setWorking(false);
    }
  }

  async function runValidation(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    setWorking(true);
    try {
      await adminFetch(`/api/v1/admin/imports/${importJobId}/run`, token, { method: "POST" });
      await loadReport(importJobId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검증 실행 실패");
    } finally {
      setWorking(false);
    }
  }

  async function applyImport(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    setWorking(true);
    try {
      await adminFetch(`/api/v1/admin/imports/${importJobId}/apply`, token, { method: "POST" });
      await loadReport(importJobId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "적용 실행 실패");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main>
      <div className="card">
        <h1>Import 관리</h1>
        <p className="subtext">업로드, 검증, 실제 반영을 순차적으로 수행합니다.</p>
      </div>

      <div style={{ height: "0.8rem" }} />
      <div className="card">
        <input
          className="input"
          type="file"
          accept=".json,application/json"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <div style={{ height: "0.8rem" }} />
        <button className="button" disabled={working} onClick={() => void onUpload()}>
          {working ? "처리 중..." : "파일 업로드"}
        </button>
      </div>

      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}

      <div className="list">
        {jobs.map((job) => (
          <div className="list-item" key={job.import_job_id}>
            <h3>{job.file_name}</h3>
            <p>ID: {job.import_job_id}</p>
            <p>상태: {job.status}</p>
            <p>소스: {job.source_type}</p>
            <p>생성: {job.created_at}</p>
            <p>최근 실행: {job.latest_run?.run_status ?? "-"}</p>
            <div className="row">
              <button className="button-ghost" onClick={() => void loadReport(job.import_job_id)}>
                Report
              </button>
              <button className="button-ghost" onClick={() => void runValidation(job.import_job_id)}>
                Validate
              </button>
              <button className="button-ghost" onClick={() => void applyImport(job.import_job_id)}>
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport ? (
        <>
          <div style={{ height: "0.8rem" }} />
          <div className="card">
            <h3>선택된 리포트: {selectedJobId}</h3>
            <p>valid: {String(selectedReport.report.valid)}</p>
            <p>rows_total: {selectedReport.report.rows_total}</p>
            <p>file_hash: {selectedReport.report.file_hash ?? "-"}</p>
            <p>file_size_bytes: {selectedReport.report.file_size_bytes}</p>
            <p>errors: {selectedReport.report.errors.length}</p>
            <p>warnings: {selectedReport.report.warnings.length}</p>
            <pre>{JSON.stringify(selectedReport.report.table_counts, null, 2)}</pre>
          </div>
        </>
      ) : null}

      <div style={{ height: "0.8rem" }} />
      <Link className="button-ghost" href="/admin">
        관리자 홈
      </Link>
    </main>
  );
}
