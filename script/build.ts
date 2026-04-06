import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Packages to bundle into the Replit server build to reduce syscalls
// and improve cold start times on the always-on Replit server.
const replitAllowlist = [
  "connect-pg-simple",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "nanoid",
  "passport",
  "passport-local",
  "pg",
  "ws",
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

  // Replit: bundle allowlisted deps for faster cold starts
  const replitExternals = allDeps.filter((dep) => !replitAllowlist.includes(dep));

  const baseBuildConfig = {
    platform: "node" as const,
    bundle: true,
    format: "cjs" as const,
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    logLevel: "info" as const,
  };

  // Replit production server (calls httpServer.listen)
  await esbuild({
    ...baseBuildConfig,
    entryPoints: ["server/index.ts"],
    outfile: "dist/index.cjs",
    external: replitExternals,
  });

  // Vercel serverless handler — externalize ALL deps so Vercel's npm install
  // handles them, keeping the function bundle small and under size limits.
  console.log("building vercel handler...");
  await esbuild({
    ...baseBuildConfig,
    entryPoints: ["server/handler.ts"],
    outfile: "api/_server.cjs",
    external: allDeps,
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
