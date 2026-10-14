import type { IAutoMovieMotion } from "@automovie/interface";

import { createSparClip } from "./createSparClip";

/**
 * Assemble the blue actor's defence and authored fall from the shared sparring moments for a compatible stick-rig identity. Timing is seconds and angular inputs are authored degrees.
 *
 * @evidence contracts/common.md#principled-implementation The blue projection keeps the shared instants and blue-specific pose/root transforms with the existing non-looping duration and easing.
 * @evidence contracts/common.md#clear-and-simple-design The side wrapper exposes one existing clip role while a shared projection owns keyframe assembly and the page owns playback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A root-driven fall is choreography rather than a simulated impact or clinically verified collapse; compatibility with the supplied rig is not validated here.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies blue defence/fall, target-rig premise and time/angular units.
 * @evidence contracts/performance.md#efficient-algorithms One O(m) moment projection allocates frame/pose shells while borrowing authored joint/root data; playback and GPU rendering remain separate costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The blue clip shares red's single moment source and final instant, preventing drift from separately generated exchange timing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned clip shells are caller-owned and borrowed timeline records remain module data; no worker, timer or GPU allocation occurs in this producer.
 *
 * @author Samchon
 */
export function blueClip(skeleton: string): IAutoMovieMotion {
  return createSparClip(skeleton, "blue");
}
