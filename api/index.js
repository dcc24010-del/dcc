// ESM file (package.json has "type":"module").
// createRequire lets ESM load the pre-compiled CJS handler without issues.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mod = require("./_server.cjs");
export default mod.default ?? mod;
