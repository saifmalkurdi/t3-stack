import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return <ProfileClient />;
}
