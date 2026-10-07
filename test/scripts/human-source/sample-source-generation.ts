/**
 * Acquire the pinned upstream and sample it for a source generation (#2689),
 * from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/sample-source-generation.ts BLENDER ARCHIVES WORK
 *
 * BLENDER is the Blender executable (the run was recorded with 5.1.2);
 * ARCHIVES an archive cache directory, empty for a fresh download from the
 * locked locators; WORK a new directory outside the repository's tracked
 * tree, in the session's permitted authoring storage.
 *
 * 1. `prepare-mpfb-profile.py` downloads or reuses each consumed archive,
 *    verifies content and license digests against `upstream-lock.json`,
 *    unpacks and builds an isolated Blender profile.
 * 2. `sample-mpfb-generation.py` samples the default human with that profile
 *    (`BLENDER_USER_RESOURCES`), so no global Blender setting changes.
 *
 * The run stops at the sample. The authored head provider, its replay and
 * the dimensional head endpoints are all computed from this sample, so they
 * cannot exist before it; `compile-source-generation.ts` compiles the
 * generation once those stages have run on this WORK.
 *
 * Child processes run without a console window; a non-zero exit stops the run.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [blender, archives, work] = process.argv.slice(2);
if (blender === undefined || archives === undefined || work === undefined)
  throw new Error("Usage: sample-source-generation.ts BLENDER ARCHIVES WORK");
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
