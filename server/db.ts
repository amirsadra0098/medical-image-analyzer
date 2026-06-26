import { eq, desc, and, count, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertAnalysis, users, analyses } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USER HELPERS ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    (values as Record<string, unknown>)[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createEmailUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<{ id: number; openId: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date(),
  });

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return { id: result[0].id, openId };
}

export async function updateUserLastLogin(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getAllUsers(search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const offset = (page - 1) * limit;
  const whereClause = search
    ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))
    : undefined;

  const [rows, totalRows] = await Promise.all([
    db.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
  ]);

  return { users: rows, total: totalRows[0]?.count ?? 0 };
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── ANALYSIS HELPERS ────────────────────────────────────────────────────────

export async function createAnalysis(data: InsertAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(analyses).values(data);
  const result = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.userId, data.userId!), eq(analyses.imageKey, data.imageKey)))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return result[0];
}

export async function updateAnalysis(id: number, data: Partial<InsertAnalysis>) {
  const db = await getDb();
  if (!db) return;
  await db.update(analyses).set({ ...data, updatedAt: new Date() }).where(eq(analyses.id, id));
}

export async function getAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result[0];
}

export async function getUserAnalyses(userId: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { analyses: [], total: 0 };

  const offset = (page - 1) * limit;
  const [rows, totalRows] = await Promise.all([
    db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(analyses).where(eq(analyses.userId, userId)),
  ]);

  return { analyses: rows, total: totalRows[0]?.count ?? 0 };
}

export async function getAllAnalyses(filters?: { status?: string; search?: string }, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { analyses: [], total: 0 };

  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      analysis: analyses,
      userName: users.name,
      userEmail: users.email,
    })
    .from(analyses)
    .leftJoin(users, eq(analyses.userId, users.id))
    .orderBy(desc(analyses.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRows = await db.select({ count: count() }).from(analyses);

  return { analyses: rows, total: totalRows[0]?.count ?? 0 };
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalAnalyses: 0, completedAnalyses: 0, rejectedAnalyses: 0, todayAnalyses: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, totalAnalyses, completedAnalyses, rejectedAnalyses, todayAnalyses] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(analyses),
    db.select({ count: count() }).from(analyses).where(eq(analyses.status, "completed")),
    db.select({ count: count() }).from(analyses).where(eq(analyses.status, "rejected")),
    db.select({ count: count() }).from(analyses).where(sql`${analyses.createdAt} >= ${today}`),
  ]);

  return {
    totalUsers: totalUsers[0]?.count ?? 0,
    totalAnalyses: totalAnalyses[0]?.count ?? 0,
    completedAnalyses: completedAnalyses[0]?.count ?? 0,
    rejectedAnalyses: rejectedAnalyses[0]?.count ?? 0,
    todayAnalyses: todayAnalyses[0]?.count ?? 0,
  };
}
