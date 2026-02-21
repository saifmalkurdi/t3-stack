import { analyticsRouter } from "~/server/api/routers/analytics";
import { authRouter } from "~/server/api/routers/auth";
import { bookmarkRouter } from "~/server/api/routers/bookmark";
import { likeRouter } from "~/server/api/routers/like";
import { notificationRouter } from "~/server/api/routers/notification";
import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  like: likeRouter,
  bookmark: bookmarkRouter,
  auth: authRouter,
  analytics: analyticsRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
