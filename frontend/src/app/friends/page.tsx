"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, type FriendRequest, type PublicUser } from "@/lib/api";

export default function FriendsPage() {
  const { user } = useAuth();
  const [me, setMe] = useState<PublicUser | null>(null);
  const [friends, setFriends] = useState<PublicUser[] | null>(null);
  const [incoming, setIncoming] = useState<FriendRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<FriendRequest[] | null>(null);
  const [addresseeId, setAddresseeId] = useState("");
  const [error, setError] = useState("");

  function load() {
    if (!user) return;
    apiFetch(user, "/user/me").then(setMe).catch(() => {});
    apiFetch(user, "/friend").then(setFriends).catch(() => {});
    apiFetch(user, "/friend/requests/incoming").then(setIncoming).catch(() => {});
    apiFetch(user, "/friend/requests/outgoing").then(setOutgoing).catch(() => {});
  }

  useEffect(load, [user]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      await apiFetch(user, "/friend/requests", {
        method: "POST",
        body: JSON.stringify({ addresseeId }),
      });
      setAddresseeId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 실패");
    }
  }

  async function handleAccept(id: string) {
    if (!user) return;
    await apiFetch(user, `/friend/requests/${id}/accept`, { method: "PATCH" });
    load();
  }

  async function handleReject(id: string) {
    if (!user) return;
    await apiFetch(user, `/friend/requests/${id}`, { method: "DELETE" });
    load();
  }

  async function handleUnfriend(friendUserId: string) {
    if (!user) return;
    if (!confirm("이 친구를 삭제할까요?")) return;
    await apiFetch(user, `/friend/${friendUserId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <Link href="/" className="text-sm text-zinc-500">
        ← 홈
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">친구</h1>

      <p className="text-sm text-zinc-500">
        내 사용자 ID (친구에게 공유해서 요청을 받으세요):{" "}
        <span className="font-mono text-black dark:text-zinc-50">{me?.id}</span>
      </p>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="상대방 사용자 ID"
          value={addresseeId}
          onChange={(e) => setAddresseeId(e.target.value)}
          required
          className="flex-1 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
        />
        <button className="rounded bg-foreground px-4 py-2 text-background">요청</button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <section>
        <h2 className="mb-2 text-sm text-zinc-500">받은 요청</h2>
        <ul className="flex flex-col gap-2">
          {incoming?.length === 0 && <p className="text-sm text-zinc-500">없음</p>}
          {incoming?.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="text-black dark:text-zinc-50">{r.requester?.name}</span>
              <span className="flex gap-3">
                <button
                  onClick={() => handleAccept(r.id)}
                  className="text-sm text-black dark:text-zinc-50"
                >
                  수락
                </button>
                <button onClick={() => handleReject(r.id)} className="text-sm text-red-500">
                  거절
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-zinc-500">보낸 요청</h2>
        <ul className="flex flex-col gap-2">
          {outgoing?.length === 0 && <p className="text-sm text-zinc-500">없음</p>}
          {outgoing?.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="text-black dark:text-zinc-50">{r.addressee?.name}</span>
              <button onClick={() => handleReject(r.id)} className="text-sm text-zinc-500">
                취소
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-zinc-500">친구 목록</h2>
        <ul className="flex flex-col gap-2">
          {friends?.length === 0 && <p className="text-sm text-zinc-500">아직 친구가 없습니다.</p>}
          {friends?.map((f) => (
            <li key={f.id} className="flex items-center justify-between">
              <span className="text-black dark:text-zinc-50">{f.name}</span>
              <button onClick={() => handleUnfriend(f.id)} className="text-sm text-red-500">
                삭제
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
