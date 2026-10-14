import path from "node:path";
import { isAutoMovieProductionProjectPathInside } from "./isAutoMovieProductionProjectPathInside";

/**
 * Resolve an owned project address under its native lexical root fence.
 *
 * @evidence contracts/common.md#principled-implementation Resolves using native path semantics, then refuses a result outside the root-inclusive containment relation; project readers and mutations apply their physical and record-kind checks after this lexical step.
 * @evidence contracts/common.md#clear-and-simple-design Keeps path resolution separate from symlink, directory and file identity admission so read and publication helpers share one lexical policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filename bypasses the root fence; an already absolute in-root address and the root itself retain existing admission, while portable spelling and regular-file requirements belong to their callers.
 * @evidence contracts/common.md#meaningful-documentation States resolved return value, outside-root exception and physical-fence limit; resolving creates or reads no path.
 * @evidence contracts/performance.md#efficient-algorithms Native resolution plus one containment calculation scale with supplied path text; no directory population is walked and no file buffer is allocated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller supplies its current root/address and still performs physical admission; retaining a resolved-path cache would add path storage without replacing that work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resolved string transfers to the caller; the helper retains no namespace, path collection, descriptor or task.
 */
export function resolveAutoMovieProductionProjectPath(root: string, relative: string): string {
  const resolved: string = path.resolve(root, relative);
  if (isAutoMovieProductionProjectPathInside(root, resolved) === false)
    throw new Error(`Path "${relative}" escapes project root "${root}". Use a project-relative path inside the repository.`);
  return resolved;
}
