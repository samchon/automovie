import path from "node:path";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Native joining combines current root with the internal fixed slice name.
 * @evidence contracts/common.md#clear-and-simple-design Staging and optional reads share construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper admits no traversal/physical identity; actual callers supply fixed slice names.
 * @evidence contracts/common.md#meaningful-documentation States internal-name premise and destination.
 * @evidence contracts/performance.md#efficient-algorithms Joining costs proportional text work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current operands are used without a path table.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One pathname transfers; no handle opens.
 */
export function autoMovieProjectSlicePath(_project: IAutoMovieProjectState, name: string): string {
    return path.join(_project.root, name);
}
