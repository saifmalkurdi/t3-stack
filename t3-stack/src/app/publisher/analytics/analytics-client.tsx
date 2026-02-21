"use client";

import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Heart, FileText, TrendingUp, Loader2, BarChart2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Format "2026-02-21" → "Feb 21"
function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ActivityChart({
  data,
  color,
  emptyMessage = "No data yet",
}: {
  data: { date: string; count: number }[];
  color: string;
  emptyMessage?: string;
}) {
  const hasAnyData = data.some((d) => d.count > 0);
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  if (!hasAnyData) {
    return (
      <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          formatter={(value) => [value ?? 0, "count"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsClient() {
  const { data: likeStats, isLoading: likesLoading } =
    api.analytics.getDailyLikes.useQuery();
  const { data: publishStats, isLoading: publishLoading } =
    api.analytics.getPublishingStats.useQuery();
  const { data: myPosts, isLoading: postsLoading } =
    api.post.getMyPosts.useQuery();

  if (likesLoading || publishLoading || postsLoading) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const avgLikes =
    likeStats && likeStats.totalPosts > 0
      ? (likeStats.totalLikes / likeStats.totalPosts).toFixed(1)
      : "0";

  const sortedPosts = [...(myPosts ?? [])].sort(
    (a, b) => (b._count.likes ?? 0) - (a._count.likes ?? 0),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {likeStats?.totalLikes ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total likes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/40">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {likeStats?.totalPosts ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total posts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/40">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgLikes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. likes / post</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily likes chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-red-500" />
            Daily Likes — Last 30 Days
          </CardTitle>
          <CardDescription>
            Likes received per day across all your posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart
            data={likeStats?.dailyLikes ?? []}
            color="#f87171"
            emptyMessage="No likes received in the last 30 days"
          />
        </CardContent>
      </Card>

      {/* Publishing frequency chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Publishing Frequency — Last 30 Days
          </CardTitle>
          <CardDescription>Number of posts published per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart
            data={publishStats?.publishingFrequency ?? []}
            color="#60a5fa"
            emptyMessage="No posts published in the last 30 days"
          />
        </CardContent>
      </Card>

      {/* Per-post likes breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-purple-500" />
            Post Performance
          </CardTitle>
          <CardDescription>
            All your posts ranked by total likes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No posts yet — create your first post from the dashboard.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedPosts.map((post) => {
                const likes = post._count.likes ?? 0;
                const maxLikes = sortedPosts[0]?._count.likes ?? 1;
                const barWidth =
                  maxLikes > 0 ? Math.max((likes / maxLikes) * 100, 2) : 0;
                return (
                  <div key={post.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {post.title}
                        </p>
                        <Badge
                          variant={post.published ? "success" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Heart className="h-3.5 w-3.5 text-red-400" />
                      {likes}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
