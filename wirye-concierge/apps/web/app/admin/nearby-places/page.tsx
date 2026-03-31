"use client";

import { useEffect, useState } from "react";

import { ADMIN_TOKEN_KEY, adminFetch } from "@/lib/admin-api";
import { DEFAULT_HOTEL_ID } from "@/lib/public-api";

type NearbyRow = {
  place_id: string;
  place_name: string;
  category?: string | null;
  subcategory?: string | null;
  address?: string | null;
};

export default function AdminNearbyPlacesPage() {
  const [rows, setRows] = useState<NearbyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [address, setAddress] = useState("");

  async function loadRows() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const data = await adminFetch<NearbyRow[]>(
        `/api/v1/admin/nearby-places?hotel_id=${DEFAULT_HOTEL_ID}`,
        token,
      );
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      await adminFetch("/api/v1/admin/nearby-places", token, {
        method: "POST",
        body: JSON.stringify({
          hotel_id: DEFAULT_HOTEL_ID,
          place_name: placeName,
          category: category || null,
          subcategory: subcategory || null,
          address: address || null,
        }),
      });
      setPlaceName("");
      setCategory("");
      setSubcategory("");
      setAddress("");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    }
  }

  return (
    <main>
      <div className="card">
        <h1>주변정보 관리</h1>
      </div>
      <div style={{ height: "0.8rem" }} />

      <form className="card" onSubmit={onCreate}>
        <h3>새 항목 추가</h3>
        <input
          className="input"
          placeholder="장소명"
          value={placeName}
          onChange={(event) => setPlaceName(event.target.value)}
          required
        />
        <div style={{ height: "0.6rem" }} />
        <input
          className="input"
          placeholder="카테고리"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <div style={{ height: "0.6rem" }} />
        <input
          className="input"
          placeholder="서브카테고리"
          value={subcategory}
          onChange={(event) => setSubcategory(event.target.value)}
        />
        <div style={{ height: "0.6rem" }} />
        <input
          className="input"
          placeholder="주소"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <div style={{ height: "0.8rem" }} />
        <button className="button" type="submit">
          추가
        </button>
      </form>

      <div style={{ height: "0.8rem" }} />
      {error ? <div className="list-item">{error}</div> : null}

      <div className="list">
        {rows.map((row) => (
          <div className="list-item" key={row.place_id}>
            <h3>{row.place_name}</h3>
            <p>
              {row.category ?? "-"} / {row.subcategory ?? "-"}
            </p>
            <p>{row.address ?? "-"}</p>
            <p className="muted">{row.place_id}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
