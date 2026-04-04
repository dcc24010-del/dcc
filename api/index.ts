import express from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for Vercel (same origin, but needed for cookie credentials)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const httpServer = createServer(app);

// registerRoutes sets up routes synchronously; the admin bootstrap is fire-and-forget
const initPromise = registerRoutes(httpServer, app);

export default async function handler(req: any, res: any) {
  await initPromise;
  return app(req, res);
}
