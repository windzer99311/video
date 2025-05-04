import { db } from "@db";
import { downloads, downloadJobs, InsertDownload, InsertDownloadJob } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const storage = {
  // Download jobs
  createDownloadJob: async (data: InsertDownloadJob) => {
    return await db.insert(downloadJobs).values(data).returning();
  },

  getDownloadJob: async (id: string) => {
    return await db.query.downloadJobs.findFirst({
      where: eq(downloadJobs.id, id)
    });
  },

  updateDownloadJobProgress: async (id: string, progress: number) => {
    return await db
      .update(downloadJobs)
      .set({ progress })
      .where(eq(downloadJobs.id, id))
      .returning();
  },

  updateDownloadJobStatus: async (id: string, status: string, error?: string | null, filePath?: string) => {
    const updateData: any = { status };
    
    if (error !== undefined) {
      updateData.error = error;
    }
    
    if (filePath) {
      updateData.filePath = filePath;
    }
    
    return await db
      .update(downloadJobs)
      .set(updateData)
      .where(eq(downloadJobs.id, id))
      .returning();
  },

  // Downloads history
  saveDownload: async (data: InsertDownload) => {
    return await db.insert(downloads).values(data).returning();
  },

  getDownloads: async (limit = 10) => {
    return await db.query.downloads.findMany({
      orderBy: desc(downloads.createdAt),
      limit
    });
  },

  getDownloadById: async (id: string) => {
    // Cast column type for proper type checking
    return await db.query.downloads.findFirst({
      where: eq(downloads.downloadJobId as unknown as typeof downloads.id, id)
    });
  },

  clearDownloads: async () => {
    return await db.delete(downloads).returning();
  }
};
