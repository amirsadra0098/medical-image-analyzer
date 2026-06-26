import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  createEmailUser: vi.fn(),
  updateUserLastLogin: vi.fn(),
  getAllUsers: vi.fn(),
  updateUserStatus: vi.fn(),
  updateUserRole: vi.fn(),
  createAnalysis: vi.fn(),
  updateAnalysis: vi.fn(),
  getAnalysisById: vi.fn(),
  getUserAnalyses: vi.fn(),
  getAllAnalyses: vi.fn(),
  getPlatformStats: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("./medicalAnalysis", () => ({
  analyzeMedicalImage: vi.fn(),
  MEDICAL_REFERENCES: {
    CT_SCAN: [{ id: "ct-001", title: "Test Ref", source: "Test Source", description: "Test" }],
    MRI: [],
    XRAY: [],
  },
}));

import * as db from "./db";
import * as medicalAnalysis from "./medicalAnalysis";

function createPublicContext(): TrpcContext {
  const cookies: Record<string, string> = {};
  return {
    user: null,
    req: { protocol: "https", headers: {}, cookies } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
      role,
      isActive: true,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, cookies: {} } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.register", () => {
  it("throws CONFLICT when email already exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 1, openId: "existing", email: "test@example.com",
      name: "Existing", passwordHash: "hash", loginMethod: "email",
      role: "user", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.register({ name: "Test", email: "test@example.com", password: "password123" })
    ).rejects.toThrow("EMAIL_EXISTS");
  });

  it("creates user and returns success when email is new", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
    vi.mocked(db.createEmailUser).mockResolvedValueOnce({ id: 2, openId: "new-user" });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.register({ name: "Dr. Smith", email: "new@example.com", password: "securepass123" });
    expect(result.success).toBe(true);
    expect(result.name).toBe("Dr. Smith");
  });
});

describe("auth.login", () => {
  it("throws UNAUTHORIZED for invalid credentials", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({ email: "wrong@example.com", password: "wrongpass" })
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });
});

describe("analysis.myStats", () => {
  it("returns stats for authenticated user", async () => {
    vi.mocked(db.getUserAnalyses).mockResolvedValueOnce({
      analyses: [
        { id: 1, status: "completed" } as never,
        { id: 2, status: "rejected" } as never,
        { id: 3, status: "completed" } as never,
      ],
      total: 3,
    });

    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.analysis.myStats();
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.rejected).toBe(1);
  });
});

describe("analysis.getReferences", () => {
  it("returns medical references without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const refs = await caller.analysis.getReferences();
    expect(refs).toHaveProperty("CT_SCAN");
    expect(refs).toHaveProperty("MRI");
    expect(refs).toHaveProperty("XRAY");
  });
});

describe("admin procedures", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    vi.mocked(db.getPlatformStats).mockResolvedValueOnce({
      totalUsers: 10, totalAnalyses: 50, completedAnalyses: 40, rejectedAnalyses: 5, todayAnalyses: 3,
    });

    const caller = appRouter.createCaller(createAuthContext("user"));
    await expect(caller.admin.getStats()).rejects.toThrow();
  });

  it("returns stats for admin users", async () => {
    vi.mocked(db.getPlatformStats).mockResolvedValueOnce({
      totalUsers: 10, totalAnalyses: 50, completedAnalyses: 40, rejectedAnalyses: 5, todayAnalyses: 3,
    });

    const caller = appRouter.createCaller(createAuthContext("admin"));
    const stats = await caller.admin.getStats();
    expect(stats.totalUsers).toBe(10);
    expect(stats.totalAnalyses).toBe(50);
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
