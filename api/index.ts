import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  _res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      console.log(`${req.method} ${reqPath} ${_res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

let initError: Error | null = null;

const initPromise = (async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Go to Vercel → Project Settings → Environment Variables and add DATABASE_URL with your Supabase connection string."
    );
  }

  // Dynamic import keeps db.ts from throwing at module-load time when
  // DATABASE_URL is missing, ensuring the handler can return a clean 500.
  const { registerRoutes } = await import("../server/routes");
  await registerRoutes(httpServer, app);

  const distPath = path.join(process.cwd(), "dist", "public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "API running",
        note: "Frontend assets not found. Ensure npm run build ran and dist/public is included.",
      });
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[Express error]", err);
    res.status(status).json({ message });
  });
})().catch((err: Error) => {
  initError = err;
  console.error("[FATAL] Initialization failed:", err.message);
});

export default async function handler(req: Request, res: Response) {
  try {
    await initPromise;

    if (initError) {
      return res.status(500).json({
        error: "Server failed to initialize",
        message: initError.message,
      });
    }

    app(req, res);
  } catch (err: any) {
    console.error("[Handler error]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Unexpected error", message: err?.message });
    }
  }
}
