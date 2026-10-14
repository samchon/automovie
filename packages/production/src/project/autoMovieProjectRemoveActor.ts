import path from "node:path";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectRemoveAtomic } from "./autoMovieProjectRemoveAtomic";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Remove one encoded actor leaf through the revision-guarded quarantine remover without reading its contents. Siblings remain untouched and missing leaves keep the ordinary commit-cycle behavior; completed deletion or failed cleanup's quarantine can survive a later refusal.
 *
 * @evidence contracts/common.md#principled-implementation One encoded actor path is quarantined/removed inside a revision-guarded cycle.
 * @evidence contracts/common.md#clear-and-simple-design Removes one actor while siblings remain unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existence checks belong to callers; absence keeps the established cycle/revision behavior.
 * @evidence contracts/common.md#meaningful-documentation States selected-file scope and post-mutation refusal limits.
 * @evidence contracts/performance.md#efficient-algorithms Includes path text, concurrency checks and quarantine metadata without actor-byte reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Current witnesses are renewed rather than reusing a prior deletion result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock retirement and safe rollback are attempted; failed native cleanup can retain fences or quarantine.
 */
export function autoMovieProjectRemoveActor(_project: IAutoMovieProjectState, node: string): void {
    const file: string = path.join(_project.root, "actors", autoMovieProjectSliceFilename(node));
    _project.commitCycle((assertNamespace: () => void): void => autoMovieProjectRemoveAtomic(file, assertNamespace));
}
