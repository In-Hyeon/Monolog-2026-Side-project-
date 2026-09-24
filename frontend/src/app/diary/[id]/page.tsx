"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, type Diary } from "@/lib/api";

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [privacyScope, setPrivacyScope] = useState<"private" | "public">("private");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch(user, `/diary/${id}`)
      .then((d: Diary) => {
        setDiary(d);
        setContent(d.content);
        if (d.privacyScope !== "group") setPrivacyScope(d.privacyScope);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"));
  }, [user, id]);

  async function handleSave() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const updated = await apiFetch(user, `/diary/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ content, privacyScope }),
      });
      setDiary(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    if (!confirm("이 일기를 삭제할까요?")) return;
    await apiFetch(user, `/diary/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (error) return <p className="p-6 text-sm text-red-500">{error}</p>;
  if (!diary) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <div className="text-sm text-zinc-500">
        {diary.emoji} {new Date(diary.createdAt).toLocaleString()} · {diary.privacyScope}
      </div>

      {editing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
          />
          <select
            value={privacyScope}
            onChange={(e) => setPrivacyScope(e.target.value as "private" | "public")}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
          >
            <option value="private">나만보기</option>
            <option value="public">전체공개</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
            >
              저장
            </button>
            <button onClick={() => setEditing(false)} className="text-sm text-zinc-500">
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-black dark:text-zinc-50">{diary.content}</p>
          <div className="flex gap-4">
            <button onClick={() => setEditing(true)} className="text-sm text-zinc-500">
              수정
            </button>
            <button onClick={handleDelete} className="text-sm text-red-500">
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}
