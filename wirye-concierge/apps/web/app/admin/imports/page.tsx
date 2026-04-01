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
  created_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
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
  approved_by?: string | null;
  approved_at?: string | null;
  latest_run: RunSummary | null;
  report: ImportReport;
};

function fmt(value?: string | null): string {
  return value ?? "-";
}

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
      setError("Login required.");
      return;
    }
    try {
      const data = await adminFetch<ImportJob[]>("/api/v1/admin/imports", token);
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load import jobs.");
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function onUpload() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Login required.");
      return;
    }
    if (!selectedFile) {
      setError("Please select a JSON file.");
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
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setWorking(false);
    }
  }

  async function loadReport(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Login required.");
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
      await loadJobs();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setWorking(false);
    }
  }

  async function runValidation(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Login required.");
      return;
    }
    setWorking(true);
    try {
      await adminFetch(`/api/v1/admin/imports/${importJobId}/run`, token, { method: "POST" });
      await loadReport(importJobId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed.");
    } finally {
      setWorking(false);
    }
  }

  async function approveImport(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Login required.");
      return;
    }
    setWorking(true);
    try {
      await adminFetch(`/api/v1/admin/imports/${importJobId}/approve`, token, { method: "POST" });
      await loadReport(importJobId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setWorking(false);
    }
  }

  async function applyImport(importJobId: string) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Login required.");
      return;
    }
    setWorking(true);
    try {
      await adminFetch(`/api/v1/admin/imports/${importJobId}/apply`, token, { method: "POST" });
      await loadReport(importJobId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main>
      <div className="card">
        <h1>Import Management</h1>
        <p className="subtext">Workflow: Upload -&gt; Validate -&gt; Approve -&gt; Apply</p>
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
          {working ? "Processing..." : "Upload File"}
        </button>
      </div>

      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}

      <div className="list">
        {jobs.map((job) => (
          <div className="list-item" key={job.import_job_id}>
            <h3>{job.file_name}</h3>
            <p>ID: {job.import_job_id}</p>
            <p>Status: {job.status}</p>
            <p>Source: {job.source_type}</p>
            <p>Created At: {fmt(job.created_at)}</p>
            <p>Created By: {fmt(job.created_by)}</p>
            <p>Approved By: {fmt(job.approved_by)}</p>
            <p>Approved At: {fmt(job.approved_at)}</p>
            <p>Latest Run: {job.latest_run?.run_status ?? "-"}</p>
            <div className="row">
              <button className="button-ghost" onClick={() => void loadReport(job.import_job_id)}>
                Report
              </button>
              <button className="button-ghost" onClick={() => void runValidation(job.import_job_id)}>
                Validate
              </button>
              <button className="button-ghost" onClick={() => void approveImport(job.import_job_id)}>
                Approve
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
            <h3>Selected Report: {selectedJobId}</h3>
            <p>Status: {selectedReport.status}</p>
            <p>Approved By: {fmt(selectedReport.approved_by)}</p>
            <p>Approved At: {fmt(selectedReport.approved_at)}</p>
            <p>Valid: {String(selectedReport.report.valid)}</p>
            <p>Rows Total: {selectedReport.report.rows_total}</p>
            <p>File Hash: {fmt(selectedReport.report.file_hash)}</p>
            <p>File Size: {selectedReport.report.file_size_bytes} bytes</p>
            <p>Errors: {selectedReport.report.errors.length}</p>
            <p>Warnings: {selectedReport.report.warnings.length}</p>
            <pre>{JSON.stringify(selectedReport.report.table_counts, null, 2)}</pre>
          </div>
        </>
      ) : null}

      <div style={{ height: "0.8rem" }} />
      <Link className="button-ghost" href="/admin">
        Back To Admin Home
      </Link>
    </main>
  );
}
