"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE,
  isCorrectPassword,
  safeNextPath,
  sessionToken,
} from "./session";

export async function loginAction(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const token = sessionToken();

  if (!token || !isCorrectPassword(String(formData.get("password") ?? ""))) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  redirect(next);
}

export async function logoutAction() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}
