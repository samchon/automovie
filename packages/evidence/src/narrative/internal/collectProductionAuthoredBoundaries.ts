import fs from "node:fs";
import path from "node:path";

import { resolveProductionPhysicalPath } from "./resolveProductionPhysicalPath";

/**
 * Captures protected link targets and optional regular-file metadata without reading bytes.
 *
 * @evidence contracts/common.md#principled-implementation Depth-first directory traversal tracks resolved physical directories to stop link cycles, records protected roots/link targets and optionally passes regular-file bigint metadata to a caller without reading file bytes.
 * @evidence contracts/common.md#clear-and-simple-design One traversal owns discovery of protected physical boundaries; callbacks let the capture owner store aliases and hard-link identity without a second tree walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only absent/not-directory paths are treated as future empty input; permission, loop and other filesystem failures propagate, and file-type changes during capture throw.
 * @evidence contracts/common.md#meaningful-documentation The comment states link-target and optional metadata capture without document reads; the helper's absence handling distinguishes missing future files from operational failure.
 * @evidence contracts/performance.md#efficient-algorithms For e entries in visited physical directories and depth h, synchronous listings and realpath/stat calls dominate; each physical directory is enumerated once, and metadata callbacks add regular-file stats when requested. Sets and recursion grow with visited directories, boundaries and h, without a fixed cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The visited set reuses work for physical directory aliases during one traversal; later captures must rerun because filesystem topology is mutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local directory arrays, visited/boundary sets and recursion expire on success or throw; synchronous filesystem calls own no retained descriptor, while callback-retained metadata belongs to the caller.
 */
export function collectProductionAuthoredBoundaries(
  location: string,
  capture: (logical: string, physical: string) => void = (): void => {},
  file?: (logical: string, physical: string, metadata: fs.BigIntStats) => void,
): string[] {
  const roots: string[] = [
    "docs/body",
    "docs/revision",
    "docs/naturalness",
    "docs/review",
    "docs/evidence",
    "docs/instructions",
    ".agents/skills/contracts/story",
  ].map((directory: string): string => path.resolve(location, directory));
  const boundaries: Set<string> = new Set(
    roots.map((directory: string): string =>
      resolveProductionPhysicalPath(directory),
    ),
  );
  const visited: Set<string> = new Set();
  const walk: (directory: string) => void = (directory: string): void => {
    const physical: string = resolveProductionPhysicalPath(directory);
    capture(directory, physical);
    if (visited.has(physical)) return;
    visited.add(physical);
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if (missing(error)) return;
      throw error;
    }
    for (const entry of entries) {
      const target: string = path.join(directory, entry.name);
      const physicalEntry: string = path.join(physical, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isSymbolicLink()) {
        const physicalTarget: string = resolveProductionPhysicalPath(target);
        capture(target, physicalTarget);
        boundaries.add(physicalTarget);
        try {
          const metadata: fs.BigIntStats = fs.statSync(physicalTarget, {
            bigint: true,
          });
          if (metadata.isDirectory()) walk(target);
          else if (metadata.isFile()) file?.(target, physicalTarget, metadata);
        } catch (error) {
          if (!missing(error)) throw error;
        }
      } else if (entry.isFile() && file !== undefined) {
        const metadata: fs.BigIntStats = fs.statSync(physicalEntry, {
          bigint: true,
        });
        if (!metadata.isFile())
          throw new Error("A protected input changed type during capture.");
        file(target, physicalEntry, metadata);
      }
    }
  };
  for (const root of roots) walk(root);
  return [...boundaries];
}

/**
 * Treats absent future documents as empty while preserving permission and loop failures.
 *
 * Principled implementation: Only Error instances carrying ENOENT or ENOTDIR are classified as absent future paths; unknown exceptions remain operational failures.
 * Clear and simple design: The shared predicate keeps root and symlink-target absence handling aligned inside boundary capture.
 * Prohibited implementation shortcuts: Permission and symlink-loop errors are not retried or suppressed, and no fixture-specific error spelling is admitted.
 * Meaningful documentation: The comment explains future-document absence versus permission/loop failure behavior.
 * Efficient algorithms: The check uses one instanceof test and a two-entry literal membership comparison with constant time and space.
 * Reuse equivalent work: This pure error predicate coordinates no requests, phases or reusable effects.
 * Bound retention and release resources: The predicate retains no error object, handle or task after return.
 */
function missing(error: unknown): boolean {
  return (
    error instanceof Error &&
    ["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")
  );
}
