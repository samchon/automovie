import { copyFile, lstat, mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

import { motionFileDigest, motionSourceIdentity } from "./motionSourceIdentity";

/**
 * Seal the completed current production and actual admitted whole bake for capture.
 * @evidence contracts/common.md#implementation-and-ownership Checks the explicitly supplied bake SHA, complete60second/24fps admission, actual model fingerprints and current production/Human/Engine/Viewer source maps. Vite builds a fresh owned directory without deleting anything or copying unrelated historical media. Only the exact whole bake is added. Before/after source identity and actual bundle hashes are retained; no external library is vendored separately.
 * @evidence contracts/common.md#authoring-interface Run after actual whole review with arguments bakePath expectedSHA optionalFreshBundleDirectory. Paths must remain under this production and the output parent must be real and owned. Existing bundle targets refuse. Serve that retained directory with Vite preview; the manifest supplies actual HTTP assets and fixed input to public Render. This does not approve unseen motion or submit generation.
 */
export async function sealMotionBundle(): Promise<void> {
  const root: string = fileURLToPath(new URL("../", import.meta.url));
  const input: string = path.resolve(root, process.argv[2] ?? "");
  const expected: string = process.argv[3] ?? "";
  const output: string = path.resolve(root, process.argv[4] ?? "output/motion-bundle");
  for (const target of [input, output]) if (path.relative(root, target).startsWith("..") || path.isAbsolute(path.relative(root, target))) throw new Error("Motion inputs/output must stay in this production");
  if (!/^[a-f0-9]{64}$/.test(expected) || await motionFileDigest(input) !== expected) throw new Error("Explicit admitted bake SHA mismatch");
  const body: { admitted: boolean; format: string; fps: number; durationSeconds: number; frames: unknown[]; source: Awaited<ReturnType<typeof motionSourceIdentity>>; models?: unknown } = JSON.parse(await readFile(input, "utf8")) as typeof body;
  const before: Awaited<ReturnType<typeof motionSourceIdentity>> = await motionSourceIdentity();
  if (!body.admitted || body.format !== "look-at-me-duel-motion-bake-v2" || body.fps !== 24 || body.durationSeconds !== 60 || body.frames.length !== 1441 || body.models === undefined || JSON.stringify(before) !== JSON.stringify(body.source)) throw new Error("Whole bake is incomplete, unadmitted or belongs to different source/models");
  const parent: string = path.dirname(output);
  await mkdir(parent, { recursive: true });
  if (await realpath(parent) !== parent || (await lstat(parent)).isSymbolicLink()) throw new Error("Bundle parent must be the task's physical directory");
  await mkdir(output); // Existing revisions refuse rather than being overwritten.
  await build({ root, build: { outDir: output, copyPublicDir: false, emptyOutDir: false } });
  await mkdir(path.join(output, "motion"));
  await copyFile(input, path.join(output, "motion/whole-motion.json"));
  const files: { path: string; sha256: string; bytes: number }[] = [];
  /** Retain exact served files, including the fixed playback dependency. */
  async function inventory(directory: string, prefix: string = ""): Promise<void> {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const full: string = path.join(directory, item.name); const relative: string = prefix + item.name;
      if (item.isDirectory()) await inventory(full, relative + "/");
      else if (item.isFile()) files.push({ path: relative, sha256: await motionFileDigest(full), bytes: (await stat(full)).size });
    }
  }
  await inventory(output);
  if (JSON.stringify(before) !== JSON.stringify(await motionSourceIdentity())) throw new Error("Source changed while sealing; preserve this unadmitted bundle");
  await writeFile(path.join(root, "docs/analysis/motion-bundle.json"), JSON.stringify({ status: "Actual immutable production bundle; motion review remains separately owned", createdAt: new Date().toISOString(), directory: path.relative(root, output).replaceAll("\\", "/"), input: { originalPath: path.relative(root, input).replaceAll("\\", "/"), servedPath: "motion/whole-motion.json", sha256: expected, bytes: (await stat(input)).size, models: body.models }, source: before, files, retention: "locally-retained-only; no verified archive" }, null, 2) + "\n");
  console.log({ directory: output, files: files.length, inputSha256: expected });
}

void sealMotionBundle().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
