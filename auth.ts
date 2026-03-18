import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { BASE_URL } from "./lib/constants";

const REQUIRED_DASHBOARD_ROLE = "admin";
const REQUIRED_DASHBOARD_CATEGORY = "construction";

type LoginResponse = {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    _id: string;
    email: string;
    name: string;
    role: "admin" | "manager" | "client";
    category?: string;
  };
};

type RefreshResponse = {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
};

function parseJwtExpiryMs(token?: string) {
  if (!token) return 0;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    return Number(payload.exp) * 1000;
  } catch {
    return 0;
  }
}

async function refreshAccessToken(token: JWT) {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to refresh token");

    const json = (await res.json()) as RefreshResponse;
    const nextAccessToken = json.data?.accessToken;
    const nextRefreshToken = json.data?.refreshToken;

    return {
      ...token,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpires: parseJwtExpiryMs(nextAccessToken),
      error: undefined,
    };
  } catch {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        category: {},
      },
      async authorize(credentials) {
        const validated = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
            category: z.string().default(REQUIRED_DASHBOARD_CATEGORY),
          })
          .safeParse(credentials);

        if (!validated.success) return null;

        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated.data),
          cache: "no-store",
        });

        if (!res.ok) return null;
        const json = (await res.json()) as LoginResponse;
        if (!json.success || !json.data?.accessToken) return null;

        const resolvedRole = String(json.data.role ?? "").trim().toLowerCase();
        const resolvedCategory = String(json.data.category ?? "").trim().toLowerCase();
        if (
          resolvedRole !== REQUIRED_DASHBOARD_ROLE ||
          resolvedCategory !== REQUIRED_DASHBOARD_CATEGORY
        ) {
          return null;
        }

        return {
          id: json.data._id,
          name: json.data.name,
          email: json.data.email,
          role: json.data.role,
          category: resolvedCategory,
          accessToken: json.data.accessToken,
          refreshToken: json.data.refreshToken,
          accessTokenExpires: parseJwtExpiryMs(json.data.accessToken),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.category = user.category;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        return token;
      }

      if (Date.now() < Number(token.accessTokenExpires ?? 0) - 60_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user._id = token.sub as string;
        session.user.role = token.role as "admin" | "manager" | "client";
        session.user.category = token.category as string | undefined;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
});
