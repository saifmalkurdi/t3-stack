import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { BookmarksClient } from "./bookmarks-client";

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return <BookmarksClient />;
}
