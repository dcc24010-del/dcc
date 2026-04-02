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
