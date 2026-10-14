import path from "node:path";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectRemoveAtomic } from "./autoMovieProjectRemoveAtomic";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation An encoded prop filename uses the guarded quarantine remover.
 * @evidence contracts/common.md#clear-and-simple-design Deletes one prop without rewriting siblings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic admission or missing-file substitute is added.
 * @evidence contracts/common.md#meaningful-documentation States removal scope and cycle effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes encoding, concurrency checks and quarantine operations without prop-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work The current revision/namespace are reacquired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cycle token retirement is attempted and can retain fences after failure; quarantine cleanup/restoration belongs to the remover.
 */
export function autoMovieProjectRemoveProp(_project: IAutoMovieProjectState, node: string): void {
    const file: string = path.join(_project.root, "props", autoMovieProjectSliceFilename(node));
    _project.commitCycle((assertNamespace: () => void): void => autoMovieProjectRemoveAtomic(file, assertNamespace));
}
