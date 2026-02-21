import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const likeRouter = createTRPCRouter({
  // Toggle like on a post
  toggle: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.like.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existing) {
        await ctx.db.like.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await ctx.db.like.create({
          data: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        });

        // Create notification for the post owner (skip if user likes own post)
        const post = await ctx.db.post.findUnique({
          where: { id: input.postId },
          select: { createdById: true, title: true },
        });
        if (post && post.createdById !== ctx.session.user.id) {
          const liker = await ctx.db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { name: true },
          });
          await ctx.db.notification.create({
            data: {
              userId: post.createdById,
              message: `${liker?.name ?? "Someone"} liked your post "${post.title}"`,
            },
          });
        }

        return { liked: true };
      }
    }),

  // Get like status for the current user on a post
  getStatus: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const like = await ctx.db.like.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });
      return { liked: !!like };
    }),

  // Get like statuses for multiple posts
  getBulkStatus: protectedProcedure
    .input(z.object({ postIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      const likes = await ctx.db.like.findMany({
        where: {
          userId: ctx.session.user.id,
          postId: { in: input.postIds },
        },
        select: { postId: true },
      });
      const likedSet = new Set(likes.map((l) => l.postId));
      return input.postIds.reduce(
        (acc, id) => {
          acc[id] = likedSet.has(id);
          return acc;
        },
        {} as Record<number, boolean>,
      );
    }),

  // Public: get like count for a post
  getCount: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.like.count({
        where: { postId: input.postId },
      });
      return { count };
    }),
});
