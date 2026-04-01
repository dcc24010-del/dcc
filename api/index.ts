import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
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
      console.log(`${req.method} ${reqPath} ${_res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

const initPromise = (async () => {
  await registerRoutes(httpServer, app);

  const distPath = path.join(process.cwd(), "dist", "public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
})();

export default async function handler(req: Request, res: Response) {
  await initPromise;
  app(req, res);
}
