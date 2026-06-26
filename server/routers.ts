import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import {
  getUserByEmail,
  createEmailUser,
  updateUserLastLogin,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  createAnalysis,
  updateAnalysis,
  getAnalysisById,
  getUserAnalyses,
  getAllAnalyses,
  getPlatformStats,
  getUserByOpenId,
} from "./db";
import { storagePut } from "./storage";
import { analyzeMedicalImage, MEDICAL_REFERENCES } from "./medicalAnalysis";
import { ENV } from "./_core/env";

// ─── ADMIN PROCEDURE ─────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── AUTH ROUTER ─────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "EMAIL_EXISTS" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const { id, openId } = await createEmailUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      const token = await sdk.signSession(
        { openId, appId: process.env.VITE_APP_ID || "", name: input.name },
        { expiresInMs: 30 * 24 * 60 * 60 * 1000 }
      );

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return { success: true, name: input.name };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_CREDENTIALS" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_CREDENTIALS" });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ACCOUNT_DISABLED" });
      }

      await updateUserLastLogin(user.id);

      const token = await sdk.signSession(
        { openId: user.openId, appId: process.env.VITE_APP_ID || "", name: user.name || user.email || "" },
        { expiresInMs: 30 * 24 * 60 * 60 * 1000 }
      );

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return { success: true, name: user.name, role: user.role };
    }),
});

// ─── ANALYSIS ROUTER ─────────────────────────────────────────────────────────
const analysisRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
        imageType: z.enum(["CT_SCAN", "MRI", "XRAY", "UNKNOWN"]),
        language: z.enum(["en", "fa"]).default("en"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const maxSize = 20 * 1024 * 1024; // 20MB
      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > maxSize) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "File too large (max 20MB)" });
      }

      const ext = input.filename.split(".").pop() || "jpg";
      const fileKey = `medical-images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.contentType);

      const analysis = await createAnalysis({
        userId: ctx.user.id,
        imageKey: fileKey,
        imageUrl: url,
        originalFilename: input.filename,
        imageType: input.imageType,
        status: "pending",
        language: input.language,
      });

      return { analysisId: analysis.id, imageUrl: url };
    }),

  analyze: protectedProcedure
    .input(z.object({ analysisId: z.number(), language: z.enum(["en", "fa"]).default("en") }))
    .mutation(async ({ input, ctx }) => {
      const analysis = await getAnalysisById(input.analysisId);
      if (!analysis) throw new TRPCError({ code: "NOT_FOUND" });
      if (analysis.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await updateAnalysis(input.analysisId, { status: "processing" });

      try {
        const imageUrl = analysis.imageUrl || `/manus-storage/${analysis.imageKey}`;
        const result = await analyzeMedicalImage(imageUrl, analysis.imageType || "CT_SCAN", input.language);

        if (!result.isMedical) {
          await updateAnalysis(input.analysisId, {
            status: "rejected",
            isMedicalImage: false,
            rejectionReason: result.rejectionReason,
          });
          return { success: true, isMedical: false, rejectionReason: result.rejectionReason };
        }

        await updateAnalysis(input.analysisId, {
          status: "completed",
          isMedicalImage: true,
          imageType: result.imageType as "CT_SCAN" | "MRI" | "XRAY" | "UNKNOWN",
          findings: result.findings,
          diagnosis: result.diagnosis,
          confidenceScore: result.confidenceScore,
          similarityScores: result.similarityScores,
          medicalReferences: result.medicalReferences,
          rawAnalysis: result.detailedAnalysis,
          language: input.language,
        });

        return { success: true, isMedical: true, analysisId: input.analysisId };
      } catch (err) {
        await updateAnalysis(input.analysisId, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Analysis failed" });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const analysis = await getAnalysisById(input.id);
      if (!analysis) throw new TRPCError({ code: "NOT_FOUND" });
      if (analysis.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return analysis;
    }),

  myHistory: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      return getUserAnalyses(ctx.user.id, input.page, input.limit);
    }),

  myStats: protectedProcedure.query(async ({ ctx }) => {
    const { analyses: rows } = await getUserAnalyses(ctx.user.id, 1, 1000);
    return {
      total: rows.length,
      completed: rows.filter((a) => a.status === "completed").length,
      rejected: rows.filter((a) => a.status === "rejected").length,
      failed: rows.filter((a) => a.status === "failed").length,
    };
  }),

  getReferences: publicProcedure.query(() => MEDICAL_REFERENCES),
});

// ─── ADMIN ROUTER ─────────────────────────────────────────────────────────────
const adminRouter = router({
  getUsers: adminProcedure
    .input(z.object({ search: z.string().optional(), page: z.number().default(1) }))
    .query(async ({ input }) => getAllUsers(input.search, input.page)),

  updateUserStatus: adminProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await updateUserStatus(input.userId, input.isActive);
      return { success: true };
    }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  getAllAnalyses: adminProcedure
    .input(z.object({ status: z.string().optional(), page: z.number().default(1) }))
    .query(async ({ input }) => getAllAnalyses({ status: input.status }, input.page)),

  getStats: adminProcedure.query(() => getPlatformStats()),
});

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  analysis: analysisRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
