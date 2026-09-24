"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

export default function NewDiaryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [entryType, setEntryType] = useState<"quick" | "full">("full");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("");
  const [privacyScope, setPrivacyScope] = useState<"private" | "public">("private");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const diary = await apiFetch(user, "/diary", {
        method: "POST",
        body: JSON.stringify({ entryType, content, emoji: emoji || undefined, privacyScope }),
      });
      router.push(`/diary/${diary.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">새 일기</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEntryType("quick")}
            className={`rounded px-3 py-1 text-sm ${entryType === "quick" ? "bg-foreground text-background" : "border border-black/[.08] dark:border-white/[.145]"}`}
          >
            원라인
          </button>
          <button
            type="button"
            onClick={() => setEntryType("full")}
            className={`rounded px-3 py-1 text-sm ${entryType === "full" ? "bg-foreground text-background" : "border border-black/[.08] dark:border-white/[.145]"}`}
          >
            정식 작성
          </button>
        </div>

        <textarea
          placeholder="오늘 하루는 어땠나요?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={entryType === "quick" ? 2 : 8}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
        />

        <input
          type="text"
          placeholder="이모지 (선택)"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={16}
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}
