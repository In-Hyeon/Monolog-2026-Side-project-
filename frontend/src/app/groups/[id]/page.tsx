"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, type GroupDetail } from "@/lib/api";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch(user, `/group/${id}`)
      .then(setGroup)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"));
  }, [user, id]);

  async function handleLeave() {
    if (!user) return;
    if (!confirm("이 그룹에서 나갈까요?")) return;
    try {
      await apiFetch(user, `/group/${id}/leave`, { method: "DELETE" });
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "나가기 실패");
    }
  }

  if (error) return <p className="p-6 text-sm text-red-500">{error}</p>;
  if (!group) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <Link href="/groups" className="text-sm text-zinc-500">
        ← 그룹 목록
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{group.name}</h1>

      <p className="text-sm text-zinc-500">
        초대 코드: <span className="font-mono">{group.inviteCode}</span>
      </p>

      <div>
        <h2 className="mb-2 text-sm text-zinc-500">멤버</h2>
        <ul className="flex flex-col gap-2">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-black dark:text-zinc-50">
              <span>{m.user.name}</span>
              <span className="text-xs text-zinc-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleLeave} className="self-start text-sm text-red-500">
        그룹 나가기
      </button>
    </div>
  );
}
