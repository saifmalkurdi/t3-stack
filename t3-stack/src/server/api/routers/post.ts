import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  publisherProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  // PUBLIC: paginated feed (infinite scroll) with optional search
  getFeed: publicProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().min(1).max(50).default(10),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search } = input;
      const items = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          published: true,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { content: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true } },
        },
      });

      let nextCursor: number | undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  // PUBLISHER: get own posts
  getMyPosts: publisherProcedure.query(async ({ ctx }) => {
    return ctx.db.post.findMany({
      where: { createdById: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { likes: true } } },
    });
  }),

  // PUBLISHER: get single post (for editing)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { likes: true } },
        },
      });
    }),

  // PUBLISHER: create post
  create: publisherProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title required"),
        content: z.string().min(1, "Content required"),
        imageUrl: z.string().optional(),
        published: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          imageUrl: input.imageUrl ?? null,
          published: input.published,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  // PUBLISHER: update post
  update: publisherProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        imageUrl: z.string().nullable().optional(),
        published: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post || post.createdById !== ctx.session.user.id) {
        throw new Error("Not found or forbidden");
      }
      return ctx.db.post.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          ...(input.published !== undefined
            ? { published: input.published }
            : {}),
        },
      });
    }),

  // PUBLISHER: delete post
  delete: publisherProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post || post.createdById !== ctx.session.user.id) {
        throw new Error("Not found or forbidden");
      }
      return ctx.db.post.delete({ where: { id: input.id } });
    }),
});
