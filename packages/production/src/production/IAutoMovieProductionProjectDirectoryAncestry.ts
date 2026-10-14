import type { IAutoMovieProductionProjectDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";

/**
 * Ordered physical directory observations guarding one owned path's ancestry.
 *
 * @evidence contracts/common.md#principled-implementation Associates every captured directory path with exact device/inode values; the project rechecks these identities around owned reads so an in-project alias or replaced ancestor cannot borrow an earlier observation.
 * @evidence contracts/common.md#clear-and-simple-design Groups the finite ancestor population without retaining descriptors; capture and assertion functions own traversal and currentness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A root-inclusive lexical result alone does not populate or validate this snapshot, and equal path strings do not replace physical identity comparison.
 * @evidence contracts/common.md#meaningful-documentation States path-to-identity association and ordered snapshot role; the readonly list view does not freeze nested objects or the filesystem.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The carrier selects no path walk or stat strategy; ancestry acquisition/assertion own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Captured identities are operands for fresh checks rather than a watcher-based equivalent-result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A read scope or project namespace owns its ancestor records, growing with captured path depth; no directory handle or running task is stored by this shape.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectDirectoryAncestry {
  /** Captured native paths and their physical identities in traversal order. */
  directories: ReadonlyArray<IAutoMovieProductionProjectDirectoryIdentity & {
    /** Native directory address whose identity was observed. */
    path: string;
  }>;
}
