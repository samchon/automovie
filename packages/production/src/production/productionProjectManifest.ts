import { IAutoMovieProductionManifest } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Return a detached layout manifest after refreshing the production fence.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes the physical root, incarnation and resident revision before structured-cloning the admitted opening manifest, preserving unknown legacy fields without sharing mutable nested values.
 * @evidence contracts/common.md#clear-and-simple-design This read projection owns cloning; refresh owns currentness checks and does not reload arbitrary layout fields from disk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No production-specific projection drops unknown fields, and an identity or revision refusal propagates before any manifest is returned.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes a detached opening layout from a newly parsed resident manifest and states the refresh-before-return boundary.
 * @evidence contracts/performance.md#efficient-algorithms Includes namespace checks and a revision JSON read, then clones all manifest data in time and space proportional to its serialized structure.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the opening's admitted layout but creates a new mutable result for each caller; a matching revision does not replace the current physical fence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the detached clone; state keeps its original manifest, and this projection retains no descriptor or task after return or refusal.
 */
export function productionProjectManifest(state: AutoMovieProductionProjectState): IAutoMovieProductionManifest {
    productionProjectRefreshRevision(state);
    return structuredClone(state.manifest_);
}
