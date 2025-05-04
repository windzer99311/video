import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { exec, spawn } from "child_process";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use a different path for production environment
const downloadsDir = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/downloads'
  : path.join(__dirname, "../downloads");

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Simple cache to store active downloads
const activeDownloads = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to get video information
  app.post("/api/video/info", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
      }

      // Execute the Python script to get video info
      const pythonScript = path.join(__dirname, "python/download.py");
      const process = spawn("python3", [pythonScript, "--info", url]);
      
      let dataChunks = "";
      let errorChunks = "";

      process.stdout.on("data", (data) => {
        dataChunks += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorChunks += data.toString();
      });

      process.on("close", (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`stderr: ${errorChunks}`);
          return res.status(500).json({ error: "Failed to fetch video info", details: errorChunks });
        }

        try {
          const videoInfo = JSON.parse(dataChunks);
          return res.json(videoInfo);
        } catch (error) {
          console.error("Failed to parse video info JSON:", error);
          return res.status(500).json({ error: "Failed to parse video info" });
        }
      });
    } catch (error) {
      console.error("Error fetching video info:", error);
      res.status(500).json({ error: "An error occurred while fetching video info" });
    }
  });

  // Route to start a download
  app.post("/api/video/download", async (req, res) => {
    try {
      const { videoId, formatId } = req.body;

      if (!videoId || !formatId) {
        return res.status(400).json({ error: "Video ID and format ID are required" });
      }

      const downloadId = randomUUID();
      const outputFilePath = path.join(downloadsDir, `${downloadId}`);

      // Store download job in database
      await storage.createDownloadJob({
        id: downloadId,
        videoId,
        formatId
      });

      // Execute Python script to download the video
      const pythonScript = path.join(__dirname, "python/download.py");
      const process = spawn("python3", [
        pythonScript,
        "--download",
        `https://www.youtube.com/watch?v=${videoId}`,
        "--itag",
        formatId.toString(),
        "--output",
        outputFilePath
      ]);

      let errorChunks = "";
      let progress = 0;
      let fileInfo: any = null;

      // Capture progress updates from the Python script
      process.stdout.on("data", (data) => {
        const output = data.toString();
        
        // Parse progress updates
        if (output.includes("progress:")) {
          const match = output.match(/progress: (\d+)/);
          if (match && match[1]) {
            progress = parseInt(match[1], 10);
            // Update job in database
            storage.updateDownloadJobProgress(downloadId, progress);
          }
        }
        
        // Parse file info (when download completes)
        if (output.includes("file_info:")) {
          try {
            const infoStr = output.substring(output.indexOf("file_info:") + 10);
            fileInfo = JSON.parse(infoStr);
          } catch (e) {
            console.error("Failed to parse file info:", e);
          }
        }
      });

      process.stderr.on("data", (data) => {
        errorChunks += data.toString();
        console.error(`stderr: ${data}`);
      });

      // Setup an object to track this download
      const downloadTracker = {
        process,
        progress: 0,
        speed: "0 MB/s",
        estimatedTime: "calculating...",
        filePath: outputFilePath,
        status: "downloading",
        error: null as string | null
      };

      // Add to active downloads
      activeDownloads.set(downloadId, downloadTracker);

      // Update the progress at intervals
      const progressInterval = setInterval(() => {
        downloadTracker.progress = progress;
      }, 500);

      // Handle process completion
      process.on("close", async (code) => {
        clearInterval(progressInterval);
        
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`stderr: ${errorChunks}`);
          
          downloadTracker.status = "error";
          downloadTracker.error = errorChunks || null;
          
          // Update job in database
          await storage.updateDownloadJobStatus(downloadId, "error", errorChunks || null);
          
          return;
        }
        
        // Download successful - update tracker and database
        downloadTracker.status = "complete";
        downloadTracker.progress = 100;
        
        if (fileInfo) {
          const { title, author, thumbnail, quality, format, size, filePath }: {
            title: string;
            author: string;
            thumbnail: string;
            quality: string;
            format: string;
            size: string;
            filePath: string;
          } = fileInfo;
          
          // Save to download history
          await storage.saveDownload({
            videoId,
            title,
            author,
            thumbnail,
            quality,
            format,
            size,
            filePath: outputFilePath + "." + format,
            downloadJobId: downloadId
          });
          
          // Update job in database
          await storage.updateDownloadJobStatus(downloadId, "complete", null, filePath);
        }
      });

      // Respond with the download ID
      res.json({ downloadId });
    } catch (error) {
      console.error("Error starting download:", error);
      res.status(500).json({ error: "An error occurred while starting the download" });
    }
  });

  // Route to check download status
  app.get("/api/download/status/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check active downloads first
      if (activeDownloads.has(id)) {
        const download = activeDownloads.get(id);
        return res.json({
          status: download.status,
          progress: download.progress,
          speed: download.speed,
          estimatedTime: download.estimatedTime,
          error: download.error
        });
      }
      
      // If not active, check database
      const downloadJob = await storage.getDownloadJob(id);
      
      if (!downloadJob) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      return res.json({
        status: downloadJob.status,
        progress: downloadJob.progress,
        speed: "0 MB/s", // Not stored in DB
        estimatedTime: "unknown", // Not stored in DB
        error: downloadJob.error
      });
    } catch (error) {
      console.error("Error checking download status:", error);
      res.status(500).json({ error: "An error occurred while checking download status" });
    }
  });

  // Route to cancel a download
  app.delete("/api/download/cancel/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (activeDownloads.has(id)) {
        const download = activeDownloads.get(id);
        
        // Kill the process
        if (download.process) {
          download.process.kill();
        }
        
        // Remove from active downloads
        activeDownloads.delete(id);
        
        // Update job in database
        await storage.updateDownloadJobStatus(id, "cancelled");
        
        return res.json({ message: "Download cancelled" });
      }
      
      return res.status(404).json({ error: "Active download not found" });
    } catch (error) {
      console.error("Error cancelling download:", error);
      res.status(500).json({ error: "An error occurred while cancelling the download" });
    }
  });

  // Route to download a file
  app.get("/api/download/file/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get download info from database
      const downloadJob = await storage.getDownloadJob(id);
      
      if (!downloadJob || downloadJob.status !== "complete") {
        return res.status(404).json({ error: "Download file not found" });
      }
      
      // Get download info from download history
      const download = await storage.getDownloadById(id);
      
      // Construct file path - use the actual path in the downloads directory
      const filePath = path.join(downloadsDir, id);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at path: ${filePath}`);
        return res.status(404).json({ error: "Download file not found on server" });
      }
      
      // Get format from download info or default to mp4
      const format = download?.format || 'mp4';
      const title = download?.title || id;
      
      // Create a sanitized filename
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedTitle}.${format}`;
      
      // Set headers for download
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      
      // Send the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "An error occurred while downloading the file" });
    }
  });

  // Route to get download history
  app.get("/api/downloads", async (req, res) => {
    try {
      const downloads = await storage.getDownloads();
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching download history:", error);
      res.status(500).json({ error: "An error occurred while fetching download history" });
    }
  });

  // Route to clear download history
  app.delete("/api/downloads", async (req, res) => {
    try {
      await storage.clearDownloads();
      res.json({ message: "Download history cleared" });
    } catch (error) {
      console.error("Error clearing download history:", error);
      res.status(500).json({ error: "An error occurred while clearing download history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
