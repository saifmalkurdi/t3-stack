"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, User, Mail, Lock, Shield, Camera } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function ProfileClient() {
  const { data: profile, isLoading } = api.auth.getProfile.useQuery();
  const utils = api.useUtils();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  useEffect(() => {
    if (profile) setName(profile.name ?? "");
  }, [profile]);

  const updateProfile = api.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Name updated!");
      await updateSession({ name });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateImage = api.auth.updateImage.useMutation({
    onSuccess: async (_, vars) => {
      toast.success(vars.image ? "Photo updated!" : "Photo removed!");
      await utils.auth.getProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateImage.mutate({ image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const changePassword = api.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated!");
      setPasswords({ current: "", next: "", confirm: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    changePassword.mutate({
      currentPassword: profile?.hasPassword ? passwords.current : undefined,
      newPassword: passwords.next,
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isGoogleUser = profile.providers.includes("google");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Profile
      </h1>

      {/* Account info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-blue-500" />
            Account Information
          </CardTitle>
          <CardDescription>Your public profile details</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Avatar — clickable to upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
              >
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.image}
                    alt={profile.name ?? ""}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  (profile.name ?? profile.email ?? "?")[0]?.toUpperCase()
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {updateImage.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.name ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Click photo to change
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={
                    profile.role === "PUBLISHER" ? "default" : "secondary"
                  }
                >
                  {profile.role === "PUBLISHER" ? "Publisher" : "Reader"}
                </Badge>
                {isGoogleUser && (
                  <Badge variant="outline" className="gap-1">
                    <GoogleIcon />
                    Google
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input
              value={profile.email ?? ""}
              readOnly
              className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          {/* Editable name */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile.mutate({ name });
            }}
            className="flex flex-col gap-1.5"
          >
            <Label
              htmlFor="display-name"
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
            >
              <User className="h-3.5 w-3.5" />
              Display name
            </Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                minLength={2}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  updateProfile.isPending || name === (profile.name ?? "")
                }
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Connected accounts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-green-500" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Sign-in methods linked to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <GoogleIcon />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Google
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sign in with your Google account
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email &amp; Password
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sign in with email and password
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-orange-500" />
            {profile.hasPassword ? "Change Password" : "Set a Password"}
          </CardTitle>
          <CardDescription>
            {profile.hasPassword
              ? "Update your sign-in password"
              : "Add a password so you can also sign in with email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            {profile.hasPassword && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords({ ...passwords, current: e.target.value })
                  }
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min 6 characters"
                value={passwords.next}
                onChange={(e) =>
                  setPasswords({ ...passwords, next: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {profile.hasPassword ? "Update password" : "Set password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
