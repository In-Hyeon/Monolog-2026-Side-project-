import type { User } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch(user: User, path: string, init: RequestInit = {}) {
  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`요청 실패 (${res.status})`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type Diary = {
  id: string;
  authorId: string;
  entryType: "quick" | "full";
  content: string;
  emoji: string | null;
  privacyScope: "private" | "public" | "group";
  promptId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  profileImage: string | null;
  createdAt: string;
};

export type Group = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  codeExpiresAt: string;
  createdAt: string;
};

export type GroupDetail = Group & {
  members: { id: string; userId: string; role: "owner" | "member"; user: PublicUser }[];
};

export type FriendRequest = {
  id: string;
  requesterId: string;
  addresseeId: string;
  createdAt: string;
  requester?: PublicUser;
  addressee?: PublicUser;
};
