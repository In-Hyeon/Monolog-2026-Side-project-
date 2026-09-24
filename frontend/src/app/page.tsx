"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, type Diary } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [diaries, setDiaries] = useState<Diary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch(user, "/diary/me")
      .then(setDiaries)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"));
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <p className="text-black dark:text-zinc-50">{user.email}</p>
        <nav className="flex items-center gap-4 text-sm text-zinc-500">
          <Link href="/groups">그룹</Link>
          <Link href="/friends">친구</Link>
          <button onClick={() => signOut(auth)}>로그아웃</button>
        </nav>
      </header>

      <Link
        href="/diary/new"
        className="rounded bg-foreground px-4 py-2 text-center text-background"
      >
        새 일기 쓰기
      </Link>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="flex flex-col gap-3">
        {diaries?.length === 0 && (
          <p className="text-sm text-zinc-500">아직 작성한 일기가 없습니다.</p>
        )}
        {diaries?.map((diary) => (
          <li key={diary.id}>
            <Link
              href={`/diary/${diary.id}`}
              className="block rounded border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>{diary.emoji}</span>
                <span>{new Date(diary.createdAt).toLocaleString()}</span>
                <span>· {diary.privacyScope}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-black dark:text-zinc-50">
                {diary.content}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
