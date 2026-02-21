import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bookmarkRouter = createTRPCRouter({
  // Toggle bookmark on a post
  toggle: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.bookmark.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existing) {
        await ctx.db.bookmark.delete({ where: { id: existing.id } });
        return { bookmarked: false };
      } else {
        await ctx.db.bookmark.create({
          data: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        });
        return { bookmarked: true };
      }
    }),

  // Get bookmark status for the current user on a single post
  getStatus: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bookmark = await ctx.db.bookmark.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });
      return { bookmarked: !!bookmark };
    }),

  // Get bookmark statuses for multiple posts
  getBulkStatus: protectedProcedure
    .input(z.object({ postIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      const bookmarks = await ctx.db.bookmark.findMany({
        where: {
          userId: ctx.session.user.id,
          postId: { in: input.postIds },
        },
        select: { postId: true },
      });
      const bookmarkedSet = new Set(bookmarks.map((b) => b.postId));
      return input.postIds.reduce(
        (acc, id) => {
          acc[id] = bookmarkedSet.has(id);
          return acc;
        },
        {} as Record<number, boolean>,
      );
    }),

  // Get all bookmarked posts for the current user
  getMyBookmarks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const bookmarks = await ctx.db.bookmark.findMany({
        where: { userId: ctx.session.user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: {
              createdBy: {
                select: { id: true, name: true, image: true },
              },
              _count: { select: { likes: true } },
            },
          },
        },
      });

      let nextCursor: number | undefined;
      if (bookmarks.length > limit) {
        nextCursor = bookmarks.pop()!.id;
      }

      return {
        items: bookmarks.map((b) => b.post),
        nextCursor,
      };
    }),
});
