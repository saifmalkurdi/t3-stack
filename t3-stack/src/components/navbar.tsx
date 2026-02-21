"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/components/theme-provider";
import { api } from "~/trpc/react";
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
} from "lucide-react";

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const utils = api.useUtils();
  const { data: notifications, isLoading } = api.notification.getAll.useQuery();
  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => void utils.notification.getUnreadCount.invalidate(),
  });

  useEffect(() => {
    markAllRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-x-2 top-16 z-50 rounded-xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
        <button onClick={onClose} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          Close
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto sm:max-h-80">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>
        ) : !notifications?.length ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`border-b border-gray-50 px-4 py-3 text-sm last:border-0 dark:border-gray-800 ${
                n.read ? "text-gray-500 dark:text-gray-400" : "font-medium text-gray-900 dark:text-gray-100"
              }`}
            >
              <p>{n.message}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {new Date(n.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const isPublisher = session?.user?.role === "PUBLISHER";
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: profile } = api.auth.getProfile.useQuery(undefined, {
    enabled: !!session?.user,
    staleTime: 0,
  });
  const avatarUrl = profile?.image ?? session?.user?.image;

  const { data: unreadData } = api.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!session?.user && isPublisher,
    refetchInterval: 15_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [session]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-600" onClick={() => setMobileOpen(false)}>
            <Newspaper className="h-5 w-5" />
            <span>T3 Press</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {session?.user ? (
              <>
                {isPublisher ? (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/publisher/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/publisher/analytics"><BarChart2 className="h-4 w-4" />Analytics</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/feed"><Newspaper className="h-4 w-4" />Feed</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/bookmarks"><Bookmark className="h-4 w-4" />Bookmarks</Link>
                    </Button>
                  </>
                )}

                {isPublisher && (
                  <div ref={notifRef} className="relative">
                    <Button variant="ghost" size="sm" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                    {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                  </div>
                )}

                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user.name ?? session.user.email}
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={session.user.name ?? ""} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <UserCircle className="h-4 w-4" />
                    )}
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                  <LogOut className="h-4 w-4" />Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href="/auth/signin">Sign in</Link></Button>
                <Button asChild size="sm"><Link href="/auth/signup">Sign up</Link></Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle dark mode">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </nav>

          {/* Mobile right side */}
          <div className="flex items-center gap-1 sm:hidden">
            {/* Bell for publishers on mobile */}
            {session?.user && isPublisher && (
              <div ref={notifRef} className="relative">
                <Button variant="ghost" size="sm" onClick={() => { setNotifOpen((o) => !o); setMobileOpen(false); }} aria-label="Notifications" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle dark mode">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setMobileOpen((o) => !o); setNotifOpen(false); }} aria-label="Menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden dark:border-gray-700 dark:bg-gray-900/95">
            <nav className="flex flex-col gap-1">
              {session?.user ? (
                <>
                  {/* User info */}
                  <div className="mb-2 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={session.user.name ?? ""} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <UserCircle className="h-8 w-8 text-gray-400" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                    </div>
                  </div>

                  {isPublisher ? (
                    <>
                      <Link href="/publisher/dashboard" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        <LayoutDashboard className="h-4 w-4 text-blue-500" />Dashboard
                      </Link>
                      <Link href="/publisher/analytics" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        <BarChart2 className="h-4 w-4 text-purple-500" />Analytics
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/feed" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Newspaper className="h-4 w-4 text-blue-500" />Feed
                      </Link>
                      <Link href="/bookmarks" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Bookmark className="h-4 w-4 text-green-500" />Bookmarks
                      </Link>
                    </>
                  )}

                  <Link href="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    <UserCircle className="h-4 w-4 text-orange-500" />Profile
                  </Link>

                  <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

                  <button onClick={() => { void signOut({ callbackUrl: "/auth/signin" }); setMobileOpen(false); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <LogOut className="h-4 w-4" />Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    Sign in
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-3 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
