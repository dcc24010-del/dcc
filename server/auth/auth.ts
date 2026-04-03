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

function jsonError(res: any, status: number, message: string) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json({ message });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    store: new SessionStore({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || "tuition-track-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: any, user: SelectUser | false, info: { message: string }) => {
        if (err) {
          console.error("[Login] Auth error:", err.message);
          return jsonError(res, 500, err.message || "Internal server error");
        }
        if (!user) {
          return jsonError(res, 401, info?.message || "Invalid credentials");
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("[Login] Session error:", loginErr.message);
            return jsonError(res, 500, loginErr.message || "Session error");
          }
          res.setHeader("Content-Type", "application/json");
          res.json(user);
        });
      }
    )(req, res, next);
  });

  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return jsonError(res, 400, "Username already exists");
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      req.login(user, (err) => {
        if (err) return jsonError(res, 500, "Login after registration failed");
        res.setHeader("Content-Type", "application/json");
        res.status(201).json(user);
      });
    } catch (err: any) {
      console.error("[Register] Error:", err.message);
      return jsonError(res, 500, err.message || "Registration failed");
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return jsonError(res, 500, "Logout failed");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
