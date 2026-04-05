import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  const serverBuildBase = {
    platform: "node" as const,
    bundle: true,
    format: "cjs" as const,
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: externals,
    logLevel: "info" as const,
  };

  // Replit production server (calls httpServer.listen)
  await esbuild({
    ...serverBuildBase,
    entryPoints: ["server/index.ts"],
    outfile: "dist/index.cjs",
  });

  // Vercel serverless handler — output to api/_server.cjs so it lives in the
  // same directory as api/index.cjs (avoids cross-directory require issues).
  // The underscore prefix tells Vercel NOT to treat it as an API endpoint.
  console.log("building vercel handler...");
  await esbuild({
    ...serverBuildBase,
    entryPoints: ["server/handler.ts"],
    outfile: "api/_server.cjs",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
