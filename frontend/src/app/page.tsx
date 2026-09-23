"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <p className="text-black dark:text-zinc-50">
          {user.email}님, 환영합니다.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="rounded bg-foreground px-4 py-2 text-background"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
