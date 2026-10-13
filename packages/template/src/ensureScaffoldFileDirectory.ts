import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { assertScaffoldPhysicalDirectory } from "./assertScaffoldPhysicalDirectory";
import { captureScaffoldPhysicalDirectory } from "./captureScaffoldPhysicalDirectory";
import { missingPath } from "./missingPath";
import { captureEmptyScaffoldPhysicalDirectory } from "./captureEmptyScaffoldPhysicalDirectory";
import { inside } from "./inside";
import * as fs from "node:fs";
import * as path from "node:path";


/**
 * Resolve, creating where missing, every directory between the captured root
 * and `directory`, and return the capture of `directory`.
 *
 * Each level is checked against the root and the level above it before it is
 * read, created, or reused. A level created here must be empty. A level whose
 * real path leaves the root's real path is refused, which catches a junction
 * or symbolic link at any depth.
 *
 * @param props.base Captured scaffold root.
 * @param props.cache Captures of levels already resolved in this publication,
 *   keyed by absolute path. The function adds every level it captures; a hit
 *   is revalidated before use.
 * @param props.directory Directory to resolve, inside the root.
 * @returns The capture of `directory`, or `base` when they are the same.
 * @throws When `directory` is outside the root lexically or physically, or any
 *   level fails revalidation.
 *
 * @evidence contracts/common.md#principled-implementation Containment is decided twice: lexically with `path.relative`, which rejects `..` and absolute results, and physically by comparing native real paths, because a link can make a lexically contained path resolve elsewhere; creation uses non-recursive `mkdirSync` after revalidating the parent so only a captured parent receives a new level.
 * @evidence contracts/common.md#clear-and-simple-design The function owns descendant levels and their per-publication cache, while the caller owns the cache's lifetime and the root capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached level is still revalidated before reuse, and only a missing level is created; any other capture failure propagates.
 * @evidence contracts/common.md#meaningful-documentation The comment states the per-level checks, the cache's key and ownership, the return for the root itself, and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the depth of `directory` below the root, with a constant number of captures per level; a cache hit replaces the capture and creation of a level with one revalidation.
 * @evidence contracts/performance.md#reuse-equivalent-work A level captured for an earlier file of the same publication is reused from `props.cache` when its absolute path matches, and equivalence is proved by revalidating its identity and real path before use; a changed level throws rather than being recaptured.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's cache grows by one scalar capture per distinct candidate directory and holds no descriptor; identity helpers attempt close before returning, propagating close errors without proving release. Created directories are not removed on a later failure.
 */
export const ensureScaffoldFileDirectory: (props: { base: IScaffoldPhysicalDirectory; cache: Map<string, IScaffoldPhysicalDirectory>; directory: string; }) => IScaffoldPhysicalDirectory = (props: {
  base: IScaffoldPhysicalDirectory;
  cache: Map<string, IScaffoldPhysicalDirectory>;
  directory: string;
}): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(props.directory);
  const relative: string = path.relative(props.base.path, absolute);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`scaffold directory escapes its base: ${absolute}`);
  let current: IScaffoldPhysicalDirectory = props.base;
  if (relative.length === 0) return current;
  for (const segment of relative.split(path.sep)) {
    const target: string = path.join(current.path, segment);
    assertScaffoldPhysicalDirectory(props.base);
    assertScaffoldPhysicalDirectory(current);
    let child: IScaffoldPhysicalDirectory | undefined = props.cache.get(target);
    if (child === undefined) {
      try {
        child = captureScaffoldPhysicalDirectory(target);
      } catch (error) {
        if (missingPath(error) === false) throw error;
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        fs.mkdirSync(target);
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        child = captureEmptyScaffoldPhysicalDirectory(target);
      }
      if (inside(props.base.real, child.real) === false)
        throw new Error(
          `scaffold directory escapes its physical base: ${target}`,
        );
      props.cache.set(target, child);
    } else assertScaffoldPhysicalDirectory(child);
    current = child;
  }
  return current;
};
