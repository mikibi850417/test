"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ADMIN_TOKEN_KEY, loginAdmin } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@wirye.local");
  const [password, setPassword] = useState("change_me_admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await loginAdmin(email, password);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="card">
        <h1>관리자 로그인</h1>
        <p className="subtext">기본 계정은 `.env`의 bootstrap 값입니다.</p>
      </div>
      <div style={{ height: "0.8rem" }} />

      <form className="card" onSubmit={onSubmit}>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div style={{ height: "0.7rem" }} />
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div style={{ height: "0.8rem" }} />
        <button className="button" disabled={loading} type="submit">
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
      </form>
    </main>
  );
}
