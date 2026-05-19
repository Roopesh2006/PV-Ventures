import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// It will automatically use the environment credentials in AIS/Cloud Run
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "gen-lang-client-0534892619",
    storageBucket: "gen-lang-client-0534892619.firebasestorage.app"
  });
}

const storage = admin.storage();
const bucket = storage.bucket();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // API Route for file upload proxy
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const userId = req.body.userId;

      if (!file) {
         return res.status(400).json({ error: "No file uploaded" });
      }

      if (!userId) {
         return res.status(400).json({ error: "User ID is required" });
      }

      // Important: Verify authentication if possible, but for now we'll rely on the userId passed
      // and the fact that this is an internal API. In production, we'd verify the ID Token.

      const blob = bucket.file(`products/${userId}/${Date.now()}_${file.originalname}`);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype
        },
        resumable: false
      });

      blobStream.on("error", (err) => {
        console.error("Upload stream error:", err);
        res.status(500).json({ error: "Failed to upload file to storage" });
      });

      blobStream.on("finish", async () => {
        try {
          // Generate a signed URL that's valid for a very long time (10 years)
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 10);
          
          const [url] = await blob.getSignedUrl({
            action: 'read',
            expires: expires
          });
          
          console.log("Upload successful, signed URL generated.");
          res.status(200).json({ url });
        } catch (signedUrlErr) {
          console.error("Error generating signed URL:", signedUrlErr);
          res.status(500).json({ error: "Upload succeeded but failed to generate access URL" });
        }
      });

      blobStream.end(file.buffer);
    } catch (error) {
      console.error("Proxy upload error:", error);
      res.status(500).json({ error: "Internal server error during upload" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
