import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Downloads table to store download history
export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  thumbnail: text("thumbnail").notNull(),
  quality: text("quality").notNull(),
  format: text("format").notNull(),
  size: text("size").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  downloadJobId: text("download_job_id")
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true,
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// Downloads in progress table
export const downloadJobs = pgTable("download_jobs", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  formatId: integer("format_id").notNull(),
  progress: integer("progress").default(0),
  status: text("status").default("pending"),
  filePath: text("file_path"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDownloadJobSchema = createInsertSchema(downloadJobs).omit({
  progress: true,
  status: true,
  filePath: true,
  error: true,
  createdAt: true,
});

export type InsertDownloadJob = z.infer<typeof insertDownloadJobSchema>;
export type DownloadJob = typeof downloadJobs.$inferSelect;
