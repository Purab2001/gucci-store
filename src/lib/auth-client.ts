"use client";

import { createAuthClient } from "better-auth/react";

// React client for browser components only. Never import server
// modules (auth.ts, db) through this file.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signUp, signIn, signOut, useSession, getSession } = authClient;
