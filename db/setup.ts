import { db } from "./index";
import { sql } from "drizzle-orm";

export async function setupDatabase() {
  try {
    console.log("Setting up database tables...");
    
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS downloads (
        id SERIAL PRIMARY KEY,
        video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        quality TEXT NOT NULL,
        format TEXT NOT NULL,
        size TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        download_job_id TEXT
      );
      
      CREATE TABLE IF NOT EXISTS download_jobs (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        format_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        file_path TEXT,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    console.log("Database setup complete!");
    return true;
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
}
