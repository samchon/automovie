import fs from "node:fs";
import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";

/**
 * Resolves live aliases only while configuring or capturing an evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Native realpath resolves the nearest existing ancestor, then lexical missing suffixes are reattached; only ENOENT/ENOTDIR trigger ancestor fallback, preserving other filesystem failures.
 * @evidence contracts/common.md#clear-and-simple-design Live resolution is isolated here for configuration/capture phases; saved-path consumers use ProductionPathCapture instead of re-resolving aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing future paths are an intended supported case; permission, symlink-loop and other realpath failures are rethrown rather than masked.
 * @evidence contracts/common.md#meaningful-documentation The comment limits live alias resolution to configuration or evaluation capture; fallback retains unresolved descendant spelling through canonical normalization.
 * @evidence contracts/performance.md#efficient-algorithms With h absent path segments, up to h+1 realpath attempts and repeated path operations occur; unshift and repeated parent/suffix processing can take quadratic segment/string work, while suffix storage grows linearly with path depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Ancestor fallback reuses the collected missing suffix within one call; results cannot be cached across captures because aliases and existence can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous realpath attempts retain no descriptor or task; the local suffix array is discarded on return or throw and one normalized string is returned.
 */
export function resolveProductionPhysicalPath(filename: string): string {
  const portable: string = filename.replaceAll("\\", "/");
  const paths: typeof path = /^[A-Za-z]:\//u.test(portable) ? path.win32 : path;
  let current: string = paths.resolve(portable);
  const remaining: string[] = [];
  while (true) {
    try {
      return canonicalProductionPath(
        paths.join(fs.realpathSync.native(current), ...remaining),
      );
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !["ENOENT", "ENOTDIR"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      )
        throw error;
      const parent: string = paths.dirname(current);
      if (parent === current) return canonicalProductionPath(filename);
      remaining.unshift(paths.basename(current));
      current = parent;
    }
  }
}
