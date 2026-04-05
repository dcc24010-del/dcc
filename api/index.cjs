// Explicit CommonJS file (.cjs) — works even when package.json has "type":"module".
// api/_server.cjs is pre-compiled by esbuild during `npm run build`,
// with all TypeScript path aliases already resolved.
// The underscore prefix on _server.cjs tells Vercel not to expose it as an endpoint.
"use strict";
const mod = require("./_server.cjs");
module.exports = mod.default ?? mod;
