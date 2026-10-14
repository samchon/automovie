import { IAutoMovieProductionManifest } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Return a detached layout manifest after refreshing the production fence.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes the physical root, incarnation and resident revision before structured-cloning the opening layout assembled from productionProjectProjectLayout, project id and admitted legacy-import metadata; nested values are detached from state.
 * @evidence contracts/common.md#clear-and-simple-design This read projection owns cloning; refresh owns currentness checks and does not reload arbitrary layout fields from disk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor's fixed layout projection is returned rather than arbitrary fields from a resident production manifest; identity, revision or structured-clone failure propagates before any result is returned.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes a detached opening layout from a newly parsed resident manifest and states the refresh-before-return boundary.
 * @evidence contracts/performance.md#efficient-algorithms Includes refresh's root/ancestry checks, full registry/incarnation/revision reads and parsing, registration sorting and retired-key membership work; structuredClone then visits and copies the complete retained layout population. No source or media payload is read here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the opening's admitted layout but creates a new mutable result for each caller; a matching revision does not replace the current physical fence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the detached clone; state keeps its original manifest, and this projection retains no descriptor or task after return or refusal.
 */
export function productionProjectManifest(state: AutoMovieProductionProjectState): IAutoMovieProductionManifest {
    productionProjectRefreshRevision(state);
    return structuredClone(state.manifest_);
}
