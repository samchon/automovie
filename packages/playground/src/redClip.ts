import type { IAutoMovieMotion } from "@automovie/interface";

import { createSparClip } from "./createSparClip";

/**
 * Assemble the red actor's side of the shared sparring choreography for the supplied compatible stick-rig identity, in seconds and authored joint degrees.
 *
 * @evidence contracts/common.md#principled-implementation Selecting the red projection preserves every shared instant, red pose/root and outgoing easeInOut interpolation; the non-looping duration comes from the final moment.
 * @evidence contracts/common.md#clear-and-simple-design A named side wrapper delegates timeline projection while the page owns playback and placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored attack labels imply no contact simulation, ROM validation or observed visual correctness; caller rig compatibility remains a premise.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies side, rig premise, seconds and authored angular units.
 * @evidence contracts/performance.md#efficient-algorithms Projection creates O(m) frame/pose wrappers for m moments and borrows the joint/root records; engine sampling and rendering retain their own cost.
 * @evidence contracts/performance.md#reuse-equivalent-work This side reads the same authored moment list as blue, preserving exact timing without independently generating a second choreography.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns clip wrappers and must preserve borrowed timeline records; the module retains its fixed choreography, while the page owns player/GPU lifetimes.
 *
 * @author Samchon
 */
export function redClip(skeleton: string): IAutoMovieMotion {
  return createSparClip(skeleton, "red");
}
