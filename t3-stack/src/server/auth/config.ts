import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "PUBLISHER" | "USER";
      onboarded: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "PUBLISHER" | "USER";
    onboarded: boolean;
  }
}

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // Re-fetch from DB when session is updated (e.g. after role selection or name change)
      if (trigger === "update" && token.id) {
        // Apply the passed-in data immediately (fast path)
        if (session && typeof session === "object") {
          if ("name" in session)
            token.name = (session as { name?: string }).name ?? token.name;
          if ("image" in session)
            token.picture =
              (session as { image?: string }).image ?? token.picture;
        }
        // Then re-sync everything from DB for full consistency
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.role = dbUser.role;
          token.onboarded = dbUser.onboarded;
        }
        return token;
      }
      // Google OAuth: upsert user in DB and store DB id + role in token
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email as string;
        let dbUser = await db.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              name: (profile.name as string | undefined) ?? email,
              email,
              role: "USER",
              onboarded: false,
            },
          });
        }
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.onboarded = dbUser.onboarded;
      } else if (user) {
        // Credentials sign-in
        token.id = user.id;
        token.role = user.role;
        token.onboarded = user.onboarded;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name as string | null | undefined,
          image: token.picture as string | null | undefined,
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
