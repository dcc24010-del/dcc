// This file is intentionally plain JavaScript.
// The actual handler is pre-compiled by esbuild (npm run build → dist/handler.cjs),
// so Vercel does not need to resolve TypeScript path aliases itself.
module.exports = require("../dist/handler.cjs");
