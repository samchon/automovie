import type {
  IAutoMovieCreateCompiledSlotSummary,
  IAutoMoviePlacementSummary,
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
 */
export function summarizeCompiledSlotRange(
  start: number,
  count: number,
  position: (slot: number) => IAutoMovieVector3,
): IAutoMoviePlacementSummary {
  const summary: IAutoMovieCreateCompiledSlotSummary.IResult =
    createCompiledSlotSummary();
  for (let slot: number = start; slot < start + count; ++slot) {
    const point: IAutoMovieVector3 = position(slot);
    summary.add(point);
  }
  return summary.finish();
}
