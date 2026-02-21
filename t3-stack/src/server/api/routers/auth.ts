import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["PUBLISHER", "USER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new Error("Email already in use");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          onboarded: true,
        },
      });

      return { id: user.id, email: user.email, role: user.role };
    }),

  setRole: protectedProcedure
    .input(z.object({ role: z.enum(["PUBLISHER", "USER"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { role: input.role, onboarded: true },
      });
      return { role: input.role };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    });
    if (!user) throw new Error("User not found");
    return {
      ...user,
      hasPassword: !!user.password,
      providers: user.accounts.map((a) => a.provider),
      password: undefined,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name },
      });
      return { success: true };
    }),

  updateImage: protectedProcedure
    .input(
      z.object({
        image: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { image: input.image },
      });
      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z
          .string()
          .min(6, "Password must be at least 6 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      });
      if (!user) throw new Error("User not found");

      // If user already has a password, verify the current one
      if (user.password) {
        if (!input.currentPassword) {
          throw new Error("Current password is required");
        }
        const valid = await bcrypt.compare(
          input.currentPassword,
          user.password,
        );
        if (!valid) throw new Error("Current password is incorrect");
      }

      const hashed = await bcrypt.hash(input.newPassword, 10);
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashed },
      });
      return { success: true };
    }),
});
