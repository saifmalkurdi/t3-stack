import { createTRPCRouter, publisherProcedure } from "~/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  // Daily like counts for the last 30 days across all publisher's posts
  getDailyLikes: publisherProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get publisher's post IDs
    const posts = await ctx.db.post.findMany({
      where: { createdById: ctx.session.user.id },
      select: { id: true },
    });
    const postIds = posts.map((p) => p.id);

    if (postIds.length === 0) {
      return { dailyLikes: [], totalLikes: 0, totalPosts: 0 };
    }

    const likes = await ctx.db.like.findMany({
      where: {
        postId: { in: postIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (const like of likes) {
      const date = like.createdAt.toISOString().split("T")[0]!;
      grouped[date] = (grouped[date] ?? 0) + 1;
    }

    // Fill in missing days
    const dailyLikes: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]!;
      dailyLikes.push({ date: dateStr, count: grouped[dateStr] ?? 0 });
    }

    const totalLikes = await ctx.db.like.count({
      where: { postId: { in: postIds } },
    });

    const totalPosts = await ctx.db.post.count({
      where: { createdById: ctx.session.user.id },
    });

    return { dailyLikes, totalLikes, totalPosts };
  }),

  // Publishing frequency: posts per day for the last 30 days
  getPublishingStats: publisherProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await ctx.db.post.findMany({
      where: {
        createdById: ctx.session.user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, number> = {};
    for (const post of posts) {
      const date = post.createdAt.toISOString().split("T")[0]!;
      grouped[date] = (grouped[date] ?? 0) + 1;
    }

    const publishingFrequency: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]!;
      publishingFrequency.push({
        date: dateStr,
        count: grouped[dateStr] ?? 0,
      });
    }

    return { publishingFrequency };
  }),
});
