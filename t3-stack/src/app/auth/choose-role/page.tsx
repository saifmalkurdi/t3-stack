"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, Newspaper, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function ChooseRolePage() {
  const [selected, setSelected] = useState<"PUBLISHER" | "USER" | null>(null);
  const { update } = useSession();

  const setRole = api.auth.setRole.useMutation({
    onSuccess: async (data) => {
      toast.success("Welcome!");
      // Refresh the JWT so the new role is reflected in the session token
      await update();
      window.location.href =
        data.role === "PUBLISHER" ? "/publisher/dashboard" : "/feed";
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose your role</CardTitle>
          <CardDescription>How do you plan to use T3 Press?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setSelected("USER")}
            className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 ${
              selected === "USER"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="rounded-full bg-green-100 p-2">
              <Newspaper className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Reader
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse posts, search content, and like articles from publishers.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelected("PUBLISHER")}
            className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 ${
              selected === "PUBLISHER"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="rounded-full bg-blue-100 p-2">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Publisher
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create and manage posts, and track analytics and engagement.
              </p>
            </div>
          </button>

          <Button
            className="mt-2 w-full"
            disabled={!selected || setRole.isPending}
            onClick={() => selected && setRole.mutate({ role: selected })}
          >
            {setRole.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
