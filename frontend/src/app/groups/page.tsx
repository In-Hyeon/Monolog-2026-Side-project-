"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, type Group } from "@/lib/api";

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  function load() {
    if (!user) return;
    apiFetch(user, "/group/mine")
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"));
  }

  useEffect(load, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      await apiFetch(user, "/group", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      await apiFetch(user, "/group/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      setInviteCode("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "참여 실패");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <Link href="/" className="text-sm text-zinc-500">
        ← 홈
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">그룹</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          placeholder="새 그룹 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
        />
        <button className="rounded bg-foreground px-4 py-2 text-background">만들기</button>
      </form>

      <form onSubmit={handleJoin} className="flex gap-2">
        <input
          type="text"
          placeholder="초대 코드"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          className="flex-1 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
        />
        <button className="rounded border border-black/[.08] px-4 py-2 dark:border-white/[.145]">
          참여
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="flex flex-col gap-3">
        {groups?.length === 0 && (
          <p className="text-sm text-zinc-500">아직 속한 그룹이 없습니다.</p>
        )}
        {groups?.map((group) => (
          <li key={group.id}>
            <Link
              href={`/groups/${group.id}`}
              className="block rounded border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              {group.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
