"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "~/components/theme-provider";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  BarChart2,
  Newspaper,
  LogOut,
  UserCircle,
  Bookmark,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  Zap,
  Trash2,
  CheckCheck,
  Loader2,
} from "lucide-react";

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const utils = api.useUtils();
  const { data: notifications, isLoading } = api.notification.getAll.useQuery(undefined, {
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const invalidate = () => {
    void utils.notification.getAll.invalidate();
    void utils.notification.getUnreadCount.invalidate();
  };

  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => { invalidate(); toast.success("All notifications marked as read"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteAll = api.notification.deleteAll.useMutation({
    onSuccess: () => { invalidate(); toast.success("All notifications cleared"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteOne = api.notification.deleteOne.useMutation({
    onSuccess: () => { invalidate(); toast.success("Notification deleted"); },
    onError: (err) => toast.error(err.message),
  });

  const hasUnread = notifications?.some((n) => !n.read) ?? false;
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="fixed inset-x-3 top-18 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-96">
      {/* Panel */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/8 dark:border-white/6 dark:bg-gray-900 dark:shadow-black/40">

        {/* Header gradient bar */}
        <div className="bg-linear-to-r from-violet-600 to-blue-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-white/70">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white/80 transition-colors hover:bg-white/25 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          {!!notifications?.length && (
            <div className="mt-3 flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-50"
                >
                  {markAllRead.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <CheckCheck className="h-3 w-3" />}
                  Mark all read
                </button>
              )}
              <button
                onClick={() => deleteAll.mutate()}
                disabled={deleteAll.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-red-500/40 disabled:opacity-50"
              >
                {deleteAll.isPending
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Trash2 className="h-3 w-3" />}
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="max-h-[55vh] divide-y divide-gray-50 overflow-y-auto sm:max-h-90 dark:divide-gray-800/60">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400 dark:text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-violet-500" />
              <p className="text-xs">Loading…</p>
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400 dark:text-gray-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <Bell className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">All caught up!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">No notifications yet</p>
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/3 ${
                  !n.read ? "bg-violet-50/50 dark:bg-violet-950/20" : ""
                }`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                )}
                {n.read && <span className="mt-1.5 h-2 w-2 shrink-0" />}

                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${n.read ? "text-gray-500 dark:text-gray-400" : "font-medium text-gray-800 dark:text-gray-100"}`}>
                    {n.message}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                <button
                  onClick={() => deleteOne.mutate({ id: n.id })}
                  disabled={deleteOne.isPending}
                  title="Delete"
                  className="mt-0.5 shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100 disabled:opacity-30 dark:text-gray-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  {deleteOne.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ src, name }: { src?: string | null; name?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        className="h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
      />
    );
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-blue-500 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
      {initials}
    </span>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: profile } = api.auth.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
  });
  const avatarUrl = profile?.image ?? session?.user?.image;
  const displayName = profile?.name ?? session?.user?.name;
  // Use DB profile role first (always fresh), fall back to JWT session role
  const isPublisher = (profile?.role ?? session?.user?.role) === "PUBLISHER";

  const utils = api.useUtils();
  const { data: unreadData } = api.notification.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated && isPublisher,
    refetchInterval: 15_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Invalidate notification list whenever the unread count increases
  // so new notifications are loaded in the background before the dropdown opens
  useEffect(() => {
    if (unreadCount > 0) void utils.notification.getAll.invalidate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  useEffect(() => { setMobileOpen(false); }, [session]);

  const navLink =
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";

  return (
    <>
      {notifOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotifOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/70 bg-white/85 backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/85">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">

          {/* Logo */}
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex select-none items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-500 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="bg-linear-to-r from-violet-600 to-blue-500 bg-clip-text text-base font-extrabold tracking-tight text-transparent">
              T3 Press
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 sm:flex">
            {isAuthenticated ? (
              <>
                {isPublisher ? (
                  <>
                    <Link href="/publisher/dashboard" className={navLink}>
                      <LayoutDashboard className="h-3.5 w-3.5" />Dashboard
                    </Link>
                    <Link href="/publisher/analytics" className={navLink}>
                      <BarChart2 className="h-3.5 w-3.5" />Analytics
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/feed" className={navLink}>
                      <Newspaper className="h-3.5 w-3.5" />Feed
                    </Link>
                    <Link href="/bookmarks" className={navLink}>
                      <Bookmark className="h-3.5 w-3.5" />Bookmarks
                    </Link>
                  </>
                )}

                <span className="mx-1.5 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                {isPublisher && (
                  <div className="relative">
                    <button onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" className={`${iconBtn} relative`}>
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                  </div>
                )}

                <button onClick={toggle} aria-label="Toggle dark mode" className={iconBtn}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <Link
                  href="/profile"
                  className="ml-1 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1.5 pr-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/80"
                >
                  <UserAvatar src={avatarUrl} name={displayName} />
                  <span className="max-w-30 truncate">{displayName ?? session?.user?.email}</span>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  aria-label="Sign out"
                  className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={toggle} aria-label="Toggle dark mode" className={`${iconBtn} mr-1`}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link
                  href="/auth/signin"
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-linear-to-r from-violet-600 to-blue-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex items-center gap-1 sm:hidden">
            {isAuthenticated && isPublisher && (
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen((o) => !o); setMobileOpen(false); }}
                  aria-label="Notifications"
                  className={`${iconBtn} relative`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
              </div>
            )}
            <button onClick={toggle} aria-label="Toggle dark mode" className={iconBtn}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setMobileOpen((o) => !o); setNotifOpen(false); }}
              aria-label="Menu"
              className={iconBtn}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-gray-200/70 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl sm:hidden dark:border-gray-800/70 dark:bg-gray-950/95">
            <nav className="flex flex-col gap-0.5">
              {isAuthenticated ? (
                <>
                  {/* User card */}
                  <div className="mb-3 flex items-center gap-3 rounded-2xl bg-linear-to-r from-violet-50 to-blue-50 px-4 py-3 dark:from-violet-950/30 dark:to-blue-950/30">
                    <UserAvatar src={avatarUrl} name={displayName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                      {isPublisher ? "Publisher" : "Reader"}
                    </span>
                  </div>

                  {isPublisher ? (
                    <>
                      <Link href="/publisher/dashboard" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                          <LayoutDashboard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </span>
                        Dashboard
                      </Link>
                      <Link href="/publisher/analytics" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                          <BarChart2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </span>
                        Analytics
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/feed" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                          <Newspaper className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </span>
                        Feed
                      </Link>
                      <Link href="/bookmarks" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                          <Bookmark className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </span>
                        Bookmarks
                      </Link>
                    </>
                  )}

                  <Link href="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                      <UserCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    </span>
                    Profile
                  </Link>

                  <div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />

                  <button
                    onClick={() => { void signOut({ callbackUrl: "/auth/signin" }); setMobileOpen(false); }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                    </span>
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/auth/signin" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Login
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

