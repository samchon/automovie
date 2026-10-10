/** Import an acquired complete native source through the normal TypeScript path.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/sample-source-generation.ts ACQUIRED_WORK NEW_WORK
 * The importer verifies the existing lock, original licenses and complete
 * sample and copies an immutable work directory for the normal TS providers
 * and source compiler. Historical Blender/tool records stay original evidence;
 * this performs no fresh MPFB extraction or numerical resampling.
 */
import path from "node:path";

import { acquireHumanSourceSample } from "./acquireHumanSourceSample.ts";

const [acquired, output, ...extra] = process.argv.slice(2);
if (acquired === undefined || output === undefined || extra.length !== 0)
  throw new Error("Usage: sample-source-generation.ts ACQUIRED_WORK NEW_WORK");
const work = acquireHumanSourceSample(acquired, output, path.resolve(__dirname, "../../.."));
console.log("[human-source] imported preserved complete native sample", work);
