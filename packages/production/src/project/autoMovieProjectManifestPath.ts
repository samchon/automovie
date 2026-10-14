import path from "node:path";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Native joining selects automovie.json below current root.
 * @evidence contracts/common.md#clear-and-simple-design Opening, refresh and registration share one coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Text alone authenticates no bytes or ancestry.
 * @evidence contracts/common.md#meaningful-documentation States the manifest filename.
 * @evidence contracts/performance.md#efficient-algorithms Joining scales with root/path text.
 * @evidence contracts/performance.md#reuse-equivalent-work Current root is read at every access.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string escapes; no file is acquired.
 */
export function autoMovieProjectManifestPath(_project: IAutoMovieProjectState): string {
    return path.join(_project.root, "automovie.json");
}
