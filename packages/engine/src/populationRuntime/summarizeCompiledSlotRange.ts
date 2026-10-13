import {
  IAutoMovieFormationBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createCompiledSlotSummary } from "./createCompiledSlotSummary";

/**
 * Exact bounds and running-mean centroid of one contiguous slot range.
 *
 * Shared by the compiled formation and compiled instance-set kernels, because a
 * chunk summary is one measurement whichever population supplies the points:
 * both visit slots in ascending order and fold the centroid with the same
 * running mean, so their bounds and centroids are the same arithmetic rather
 * than two copies that could drift in the last bit. The fold is the one the
 * builder has always compiled with, so the summaries, and the digests over
 * them, are unchanged by the kernels moving here.
 *
 * Package-private: the engine root does not export it.
 *
 * @evidence contracts/common.md#principled-implementation Fold ascending positions into axis extrema and the historical incremental mean through createCompiledSlotSummary; order is preserved because compiled digest identity depends on binary64 operation order.
 * @evidence contracts/common.md#clear-and-simple-design The range owner supplies slot addresses while the shared accumulator owns summary arithmetic, preventing drift between range and combined chunk/global folds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No slot or content id changes arithmetic; empty ranges retain infinite bounds and zero centroid and therefore are outside admitted positive population summaries.
 * @evidence contracts/common.md#meaningful-documentation Docs identify exact placement-point bounds, incremental centroid, ascending traversal and package-private sharing; geometry expansion remains separate.
 * @evidence contracts/performance.md#efficient-algorithms N positions take O(N) callback work plus constant arithmetic per point and O(1) auxiliary fold storage; callback placement cost must be included by its owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Both range and combined summaries share the accumulator implementation; each call recomputes from its ordered current points rather than caching mutable placements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the summary vectors transfer to the caller; no point history, callback reference, task or resource survives completion or failure.
 */
export const summarizeCompiledSlotRange: (start: number, count: number, position: ( slot : number ) => IAutoMovieVector3) => { bounds : IAutoMovieFormationBounds ; centroid : IAutoMovieVector3 } = (
  start: number,
  count: number,
  position: (slot: number) => IAutoMovieVector3,
): { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3 } => {
  const summary: ReturnType<typeof createCompiledSlotSummary> = createCompiledSlotSummary();
  for (let slot: number = start; slot < start + count; ++slot) {
    const point: IAutoMovieVector3 = position(slot);
    summary.add(point);
  }
  return summary.finish();
};
