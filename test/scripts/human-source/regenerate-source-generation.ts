/**
 * Regenerate source generation G1 from the pinned upstream in one run
 * (#2689 N1), from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/human-source/regenerate-source-generation.ts BLENDER ARCHIVES WORK OUTPUT
 *
 * BLENDER is the Blender executable (the run was recorded with 5.1.2);
 * ARCHIVES an archive cache directory, empty for a fresh download from the
 * locked locators; WORK and OUTPUT new directories, both outside the
 * repository's tracked tree (`.shots/` by convention).
 *
 * 1. `prepare-mpfb-profile.py` downloads or reuses each consumed archive,
 *    verifies content and license digests against `upstream-lock.json`,
 *    unpacks and builds an isolated Blender profile.
 * 2. `sample-mpfb-generation.py` samples the default human with that profile
 *    (`BLENDER_USER_RESOURCES`), so no global Blender setting changes.
 * 3. `compileHumanSourceGeneration` compiles G1, the P1 pair and the
 *    reproduction record.
 *
 * Child processes run without a console window; a non-zero exit stops the run.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { compileHumanSourceGeneration } from "./compileHumanSourceGeneration.ts";

const [blender, archives, work, output] = process.argv.slice(2);
if (blender === undefined || archives === undefined || work === undefined || output === undefined)
  throw new Error("Usage: regenerate-source-generation.ts BLENDER ARCHIVES WORK OUTPUT");
if (!fs.existsSync(blender)) throw new Error(`Blender executable not found: ${blender}`);
const repository = path.resolve(__dirname, "../../..");
const scripts = path.join(repository, "test/scripts/human-source");
const run = (args: string[], env: NodeJS.ProcessEnv): void => {
  const result = spawnSync(blender, ["--background", "--factory-startup", "--python-exit-code", "1", ...args], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Blender step failed with exit ${result.status}: ${args.join(" ")}`);
};
const workPath = path.resolve(work);
run(
  [
    "--python", path.join(scripts, "prepare-mpfb-profile.py"), "--",
    "--lock", path.join(scripts, "upstream-lock.json"),
    "--archives", path.resolve(archives),
    "--work", workPath,
  ],
  process.env,
);
run(
  [
    "--python", path.join(scripts, "sample-mpfb-generation.py"), "--",
    "--data", path.join(workPath, "upstream/mpfb2/src/mpfb/data"),
    "--extra", path.join(workPath, "upstream/mpfb-extra-targets"),
    "--assets", path.join(workPath, "upstream/makehuman-system-assets"),
    "--makehuman", path.join(workPath, "upstream/makehuman"),
    "--out", path.join(workPath, "sample"),
  ],
  { ...process.env, BLENDER_USER_RESOURCES: path.join(workPath, "blender-profile") },
);
compileHumanSourceGeneration(workPath, path.resolve(output), repository);
