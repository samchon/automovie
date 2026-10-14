import * as fs from "node:fs";
import path from "node:path";

/**
 * Refuse a legacy interrupted contract/TOC tree before its graph can report success. Any pending entry counts, including malformed files and dangling links. Recovery belongs to the original interrupted tool and its archive; this package provides no automatic recovery or current mutating maintenance command.
 *
 * @evidence contracts/common.md#principled-implementation lstat-style observations distinguish an ordinary maintenance directory from links and treat every pending marker entry, including a dangling symlink, as an incomplete mutation; only ENOENT means absence.
 * @evidence contracts/common.md#clear-and-simple-design The preflight checks two fixed legacy maintenance paths; recovery requires the original interrupted tool and archive, rather than a current package command or automatic repair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The optional stat callback is a declared observation seam, not a replaced global; non-absence I/O errors propagate and pending entries never count as successful maintenance.
 * @evidence contracts/common.md#meaningful-documentation The comment names interruption refusal, malformed or dangling markers and the recovery obligation; callers retain responsibility for the supplied production root's physical boundary.
 * @evidence contracts/performance.md#efficient-algorithms At most two metadata observations and fixed path construction occur, with no directory inventory or project-size-dependent scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation observes current maintenance state because a cached absence could become stale before a later graph admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Metadata reads leave no descriptor or retained state in this preflight, and both success and failure release the call-local path strings.
 */
export const assertAutoMovieProductionMaintenanceComplete: (root: string, stat?: (file: string) => Pick<fs.Stats, "isDirectory" | "isSymbolicLink">) => void = (
  root: string,
  stat: (
    file: string,
  ) => Pick<fs.Stats, "isDirectory" | "isSymbolicLink"> = fs.lstatSync,
): void => {
  const state: string = path.join(root, "automovie");
  for (const file of [
    state,
    path.join(state, "contract-maintenance.pending.json"),
  ]) {
    let entry: ReturnType<typeof stat>;
    try {
      entry = stat(file);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      )
        return;
      throw error;
    }
    if (file === state) {
      if (entry.isSymbolicLink() || !entry.isDirectory())
        throw new Error(
          "Production maintenance state must be an ordinary directory.",
        );
    } else
      throw new Error(
        "Legacy interrupted contract or TOC maintenance must be recovered before production evidence can be admitted. Preserve automovie/contract-maintenance.pending.json and its archive, and recover the interrupted tree using the original tool and archive. This package provides no automatic recovery or current mutating maintenance command.",
      );
  }
};
