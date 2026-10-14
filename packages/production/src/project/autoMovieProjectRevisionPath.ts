import path from "node:path";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Return revision.json joined to the handle's current root; this pathname alone admits neither the resident clock nor physical ownership.
 *
 * @evidence contracts/common.md#principled-implementation Native joining selects revision.json below the current root.
 * @evidence contracts/common.md#clear-and-simple-design Acquisition and publication share one clock coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Path text is not physical ownership admission.
 * @evidence contracts/common.md#meaningful-documentation States the legacy clock filename.
 * @evidence contracts/performance.md#efficient-algorithms Joining scales with root/path text.
 * @evidence contracts/performance.md#reuse-equivalent-work Every access reads current root text without a path cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string escapes; no file is opened.
 */
export function autoMovieProjectRevisionPath(_project: IAutoMovieProjectState): string {
    return path.join(_project.root, "revision.json");
}
