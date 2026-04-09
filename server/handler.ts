import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { ensureSchema } from "./db";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// Register all routes (auth + API) — returns a Promise
const ready = ensureSchema().then(() => registerRoutes(httpServer, app)).then(() => {
  // Global error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
  });
});

// Export for Vercel: await ready then hand off to Express
export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}
