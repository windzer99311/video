import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    // Check if we need to create the tables
    const hasDownloadsTable = await db
      .select()
      .from(schema.downloads)
      .limit(1)
      .catch(() => []);

    const hasDownloadJobsTable = await db
      .select()
      .from(schema.downloadJobs)
      .limit(1)
      .catch(() => []);

    const sampleDownloads = [
      {
        videoId: "dQw4w9WgXcQ",
        title: "React JS Crash Course 2023",
        author: "TechTutorials",
        thumbnail: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        quality: "720p",
        format: "mp4",
        size: "128 MB",
        filePath: "/downloads/sample1.mp4",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        videoId: "xvFZjo5PgG0",
        title: "Node.js API Development From Scratch",
        author: "CodeMaster",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
        quality: "480p",
        format: "mp4",
        size: "85 MB",
        filePath: "/downloads/sample2.mp4",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        videoId: "dQw4w9WgXcQ",
        title: "Python Django Web Development Tutorial",
        author: "PythonPro",
        thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
        quality: "Audio Only",
        format: "mp3",
        size: "12 MB",
        filePath: "/downloads/sample3.mp3",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
    ];

    // Only seed if no records exist
    if (hasDownloadsTable.length === 0) {
      console.log("Seeding download history...");
      await db.insert(schema.downloads).values(sampleDownloads);
      console.log("Seed completed successfully!");
    } else {
      console.log("Download history already has data, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
