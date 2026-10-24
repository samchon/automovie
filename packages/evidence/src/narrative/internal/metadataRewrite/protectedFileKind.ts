import fs from "node:fs";
import path from "node:path";

import { isNodeError } from "./isNodeError";

/**
 * Identifies missing paths, regular files, and paths that must not be followed.
 *
 * @evidence contracts/common.md#principled-implementation lstat every relative component, rejecting symlinks and nondirectory ancestors before accepting a regular final file.
 * @evidence contracts/common.md#clear-and-simple-design Physical checks supplement lexical validation so selected paths cannot bypass safety.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only ENOENT becomes missing; other filesystem errors propagate without unsafe retries.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies missing, regular and unsafe path categories.
 * @evidence contracts/performance.md#efficient-algorithms D components require up to D synchronous lstat calls plus accumulated path-construction work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both roots are checked independently because physical identities and file kinds may differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous stats leave no open handles; paths and stat objects remain call-local.
 */
export function protectedFileKind(root: string, file: string): string {
  let target: string = root;
  const parts: string[] = file.split("/");
  for (let index: number = 0; index < parts.length; index += 1) {
    target = path.join(target, parts[index]);
    try {
      const stat: fs.Stats = fs.lstatSync(target);
      if (stat.isSymbolicLink()) return "symlink";
      if (index === parts.length - 1)
        return stat.isFile() ? "file" : "non-file";
      if (!stat.isDirectory()) return "non-file";
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === "ENOENT") return "missing";
      throw error;
    }
  }
  return "non-file";
}
