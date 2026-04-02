import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { type User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const SessionStore = MemoryStore(session);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "tuition-track-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Seed default admin — wrapped in try/catch so a DB error on startup
  // does not crash the serverless function via unhandled rejection.
  (async () => {
    try {
      const admin = await storage.getUserByUsername("dynamic");
      if (!admin) {
        const hashedPassword = await bcrypt.hash("dcc2020", 10);
        await storage.createUser({
          username: "dynamic",
          password: hashedPassword,
          role: "admin",
        });
        console.log("[Auth] Default admin created.");
      }
    } catch (err: any) {
      console.error("[Auth] Could not seed default admin:", err.message);
    }
  })();

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        let user = await storage.getUserByUsername(username);

        if (!user) {
          const allStudents = await storage.getStudents();
          const student = allStudents.find(
            (s) => s.studentCustomId === username
          );
          if (student && student.userId) {
            user = await storage.getUser(student.userId);
          }

          if (!user) {
            const allUsers = await storage.getUsers();
            user =
              allUsers.find((u: any) => u.teacherId === username) ?? undefined;
          }

          if (!user) {
            return done(null, false, {
              message: "Invalid username or password",
            });
          }
        }

        const isPasswordMatch =
          password === user.password ||
          (await bcrypt.compare(password, user.password));

        if (!isPasswordMatch) {
          return done(null, false, {
            message: "Invalid username or password",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  // Use passport callback form so ALL errors are returned as JSON.
  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: any, user: SelectUser | false, info: { message: string }) => {
        if (err) {
          console.error("[Login] Auth error:", err.message);
          return res
            .status(500)
            .json({ message: err.message || "Internal server error" });
        }
        if (!user) {
          return res
            .status(401)
            .json({ message: info?.message || "Invalid credentials" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("[Login] Session error:", loginErr.message);
            return res
              .status(500)
              .json({ message: loginErr.message || "Session error" });
          }
          res.json(user);
        });
      }
    )(req, res, next);
  });

  app.post("/api/register", async (req, res) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
    });
    req.login(user, (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Login after registration failed" });
      res.status(201).json(user);
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
