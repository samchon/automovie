import fs from "node:fs";
import path from "node:path";

import type { IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import type { IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { assertScaffoldOwnership } from "./assertScaffoldOwnership";
import { captureScaffoldFile } from "./captureScaffoldFile";
import { captureScaffoldPhysicalDirectory } from "./captureScaffoldPhysicalDirectory";
import { missingPath } from "./missingPath";

/**
 * Reads an ordinary single-link sync input and captures its unchanged generation.
 *
 * @evidence contracts/common.md#principled-implementation Captured ordinary root and inner directories are revalidated around strict UTF-8 reading, and file identity/written generation must survive the read.
 * @evidence contracts/common.md#clear-and-simple-design This shared input boundary handles current instructions, state and a declared prior baseline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Linked directories/files and multi-link files refuse; only genuinely missing levels return undefined, and concurrent changes propagate.
 * @evidence contracts/common.md#meaningful-documentation The return record separates text from its later write precondition; directory and file refusals remain explicit.
 * @evidence contracts/performance.md#efficient-algorithms Parent captures scale with path depth and reading with file bytes; no directory tree is recursively enumerated.
 * @evidence contracts/performance.md#reuse-equivalent-work The root and parent captures serve the before/after ownership checks within this read; other files receive fresh observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close their descriptor; temporary directory captures hold scalar identities only and returned text/snapshot belong to the caller.
 */
export function readScaffoldSyncFile(
  location: string,
  relative: string,
): { text: string; snapshot: IScaffoldFileSnapshot } | undefined {
  const root: string = path.resolve(location);
  const base: IScaffoldPhysicalDirectory =
    captureScaffoldPhysicalDirectory(root);
  const target: string = path.resolve(root, relative);
  const local: string = path.relative(root, target);
  if (
    local === "" ||
    local === ".." ||
    local.startsWith(".." + path.sep) ||
    path.isAbsolute(local)
  )
    throw new Error("Sync input escapes its root.");
  const parents: IScaffoldPhysicalDirectory[] = [base];
  let directory: string = root;
  try {
    for (const part of local.split(path.sep).slice(0, -1)) {
      directory = path.join(directory, part);
      const captured: IScaffoldPhysicalDirectory =
        captureScaffoldPhysicalDirectory(directory);
      assertScaffoldOwnership(base, captured);
      parents.push(captured);
    }
    const snapshot: IScaffoldFileSnapshot = captureScaffoldFile(target);
    const text: string = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(fs.readFileSync(target));
    const after: IScaffoldFileSnapshot = captureScaffoldFile(target);
    if (
      snapshot.identity !== after.identity ||
      snapshot.written !== after.written
    )
      throw new Error("Sync input changed while reading: " + relative);
    for (const parent of parents) assertScaffoldOwnership(base, parent);
    return { text, snapshot };
  } catch (error) {
    if (!missingPath(error)) throw error;
    for (const parent of parents) assertScaffoldOwnership(base, parent);
    return undefined;
  }
}
