import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { Newspaper, LayoutDashboard } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true, role: true },
    });
    if (!dbUser?.onboarded) redirect("/auth/choose-role");
    if (dbUser.role === "PUBLISHER") redirect("/publisher/dashboard");
    redirect("/feed");
  }

  return (
    <div className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center gap-8 overflow-hidden px-4 text-center">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/20" />

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-blue-100 p-4 shadow-md dark:bg-blue-900/40">
          <Newspaper className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-indigo-400">
          T3 Press
        </h1>
        <p className="max-w-md text-lg text-gray-500 dark:text-gray-400">
          A modern publishing platform built with Next.js, tRPC, Prisma, and
          Tailwind CSS.
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/auth/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white/70 p-6 text-left shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/60">
          <LayoutDashboard className="mb-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">For Publishers</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage posts, view analytics, and track engagement.
          </p>
        </div>
        <div className="rounded-xl border border-green-100 bg-white/70 p-6 text-left shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/60">
          <Newspaper className="mb-3 h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">For Readers</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Discover posts, like content, and search across all publishers.
          </p>
        </div>
      </div>
    </div>
  );
}
