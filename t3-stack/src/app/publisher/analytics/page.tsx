import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  // Always read onboarded + role from DB (JWT may be stale after role selection)
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true, role: true },
  });

  if (!dbUser?.onboarded) redirect("/auth/choose-role");
  if (dbUser.role !== "PUBLISHER") redirect("/feed");

  return <AnalyticsClient />;
}
