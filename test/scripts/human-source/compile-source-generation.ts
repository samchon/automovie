/**
 * Compile source generation G1 from one sampling run (#2689 N1), from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/human-source/compile-source-generation.ts WORK OUTPUT
 *
 * WORK is a directory prepared by `prepare-mpfb-profile.py` and sampled by
 * `sample-mpfb-generation.py` (`acquisition.json`, `upstream/`, `sample/`);
 * `regenerate-source-generation.ts` runs all three. OUTPUT is a new directory.
 *
 * Use it to recompile an existing work directory after a compiler change;
 * `compileHumanSourceGeneration` owns the stage order.
 */
import path from "node:path";

import { compileHumanSourceGeneration } from "./compileHumanSourceGeneration.ts";

const [work, output] = process.argv.slice(2).map((p) => path.resolve(p));
if (work === undefined || output === undefined) throw new Error("Usage: compile-source-generation.ts WORK OUTPUT");
compileHumanSourceGeneration(work, output, path.resolve(__dirname, "../../.."));
