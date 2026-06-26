import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: text("imageUrl"),
  originalFilename: varchar("originalFilename", { length: 255 }),
  imageType: mysqlEnum("imageType", ["CT_SCAN", "MRI", "XRAY", "UNKNOWN"]).default("UNKNOWN"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "rejected"]).default("pending").notNull(),
  isMedicalImage: boolean("isMedicalImage"),
  rejectionReason: text("rejectionReason"),
  findings: json("findings"),
  diagnosis: text("diagnosis"),
  similarityScores: json("similarityScores"),
  medicalReferences: json("medicalReferences"),
  confidenceScore: float("confidenceScore"),
  rawAnalysis: text("rawAnalysis"),
  language: mysqlEnum("language", ["en", "fa"]).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;
