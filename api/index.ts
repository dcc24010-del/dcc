import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

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
      console.log(
        `${req.method} ${reqPath} ${_res.statusCode} in ${Date.now() - start}ms`
      );
    }
  });
  next();
});

app.get("/api/health", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    status: "ok",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      HAS_SESSION_SECRET: !!process.env.SESSION_SECRET,
    },
    initialized: !initError,
    error: initError ? initError.message : null,
  });
});

let initError: Error | null = null;

const initPromise = (async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Go to Vercel → Project Settings → " +
        "Environment Variables and add DATABASE_URL with your Supabase connection string."
    );
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[Express error]", err);
    res.setHeader("Content-Type", "application/json");
    res.status(status).json({ message });
  });
})().catch((err: Error) => {
  initError = err;
  console.error("[FATAL] Initialization failed:", err.message);
});

export default async function handler(req: Request, res: Response) {
  try {
    res.setHeader("Content-Type", "application/json");

    await initPromise;

    if (initError) {
      return res.status(500).json({
        message: initError.message,
      });
    }

    res.removeHeader("Content-Type");
    app(req as any, res as any);
  } catch (err: any) {
    console.error("[Handler error]", err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ message: err?.message || "Unexpected server error" });
    }
  }
}
