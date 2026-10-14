import path from "node:path";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Return revision.lock joined to the handle's current root; token acquisition, identity and retirement remain with the mutation owner rather than this path-only projection.
 *
 * @evidence contracts/common.md#principled-implementation Native joining selects revision.lock below the current root.
 * @evidence contracts/common.md#clear-and-simple-design Mutation admission and release share one coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pathname authenticates neither resident token nor physical root.
 * @evidence contracts/common.md#meaningful-documentation States the concurrency-lock coordinate.
 * @evidence contracts/performance.md#efficient-algorithms Joining scales with root/path text.
 * @evidence contracts/performance.md#reuse-equivalent-work Current root text is used rather than retained path authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string escapes; commitCycle owns tokens.
 */
export function autoMovieProjectLockPath(_project: IAutoMovieProjectState): string {
    return path.join(_project.root, "revision.lock");
}
