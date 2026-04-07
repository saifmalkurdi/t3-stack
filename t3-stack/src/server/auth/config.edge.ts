import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config for Next.js middleware.
 * Must NOT import anything that uses Node.js APIs (bcryptjs, Prisma, etc.)
 * JWT validation only needs AUTH_SECRET — no DB access required.
 */
export const authConfigEdge = {
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name,
          image: token.picture,
          role: token.role as "PUBLISHER" | "USER",
          onboarded: token.onboarded as boolean,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
