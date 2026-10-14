import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { lstatAutoMovieProductionProjectEntry } from "./lstatAutoMovieProductionProjectEntry";
import { isAutoMovieProductionProjectPathInside } from "./isAutoMovieProductionProjectPathInside";
import type { Stats } from "node:fs";

/**
 * Refuse an existing owned path that is linked, outside the root or nonregular.
 *
 * @evidence contracts/common.md#principled-implementation Allows absence for later creation, otherwise checks final-link shape, resolved containment and regular-file kind in that order; owned JSON and atomic publication guards use it before and after effects.
 * @evidence contracts/common.md#clear-and-simple-design Composes fresh entry observation and lexical containment over realpath with native shape checks; root generation and intermediate ancestry fencing remain with the enclosing operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every existing link is rejected even if its target stays in-root; a missing path is not represented as a successful existing file, and no error is swallowed as absence.
 * @evidence contracts/common.md#meaningful-documentation States absence admission, check ordering and physical-fence limits; the helper neither creates a file nor guarantees a later observation matches.
 * @evidence contracts/performance.md#efficient-algorithms One lstat and, for existing entries, one realpath plus path-length containment and stat-kind checks; no file payload is read and host path resolution dominates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated before/after calls deliberately reacquire physical facts around effects rather than reuse a stale path verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stat and path observations are local, with no retained descriptor, file buffer, path cache or task.
 */
export function assertAutoMovieProductionProjectRegularFile(rootReal: string, file: string): void {
  const linked: Stats | null = lstatAutoMovieProductionProjectEntry(file);
  if (linked === null) return;
  if (linked.isSymbolicLink()) throw new Error(`Owned file "${file}" is a symlink. Replace it with a project-local regular file.`);
  const real: string = fileSystem.realpathSync(file);
  if (isAutoMovieProductionProjectPathInside(rootReal, real) === false) throw new Error(`Owned file "${file}" escapes the production root. Replace the link with a project-local file.`);
  if (linked.isFile() === false) throw new Error(`Owned path "${file}" is not a regular file.`);
}
