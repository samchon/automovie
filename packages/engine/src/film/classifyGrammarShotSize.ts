import { IAutoMovieCameraIntent } from "@automovie/interface";

import { FRAMING_HEIGHT_FRACTION } from "./constants/FRAMING_HEIGHT_FRACTION";

/**
 * The framing a subject's measured frame occupancy reads as: the framing whose
 * {@link FRAMING_HEIGHT_FRACTION} is nearest, by ratio, to how many subject
 * sizes the frame spans.
 *
 * `frameOccupancy` is the subject's share of the frame, in (0, ∞): its height
 * over the frame's height for a subject the frame holds vertically, or its
 * width over the frame's width for one whose width placed the camera. The
 * framing solve applies {@link FRAMING_HEIGHT_FRACTION} to both axes, so the
 * axis that fills more of its own side states the size delivered, and
 * `measureGrammarShotSize` passes the larger of the two. Nearness is measured
 * on a log scale, so `close` at 0.28 and `medium` at 0.62 are separated where
 * their ratio is even; an exact tie keeps the framing listed first, wider
 * before closer. Throws when the occupancy is not finite and positive.
 *
 * @evidence contracts/common.md#principled-implementation Compares `|log(1/occupancy) − log(fraction)|` across the four framings, because framings are a geometric scale of visible subject multiples and the boundary between two neighbours is their geometric mean; the domain check keeps the logarithm defined.
 * @evidence contracts/common.md#clear-and-simple-design Classification only, separate from `measureGrammarShotSize`, which owns projection and axis choice, and reading the same fraction table the framing solve places cameras with, so a requested size and a measured size share one scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No framing is favoured beyond the stated first-listed tie rule, and no occupancy is clamped into range; a non-positive or non-finite one throws.
 * @evidence contracts/common.md#meaningful-documentation States the meaning and domain of the occupancy, which axis it comes from and why, the log-scale nearness with its effect on the boundaries, the tie rule, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Constant time, one pass over the four-entry framing table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure classification of one number that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; it returns one union member.
 */
export const classifyGrammarShotSize = (
  frameOccupancy: number,
): IAutoMovieCameraIntent["framing"] => {
  if (Number.isFinite(frameOccupancy) === false || frameOccupancy <= 0)
    throw new Error("frameOccupancy must be finite and positive.");
  const visibleSubjects: number = 1 / frameOccupancy;
  const distance: (fraction: number) => number = (fraction: number): number =>
    Math.abs(Math.log(visibleSubjects / fraction));
  let best: IAutoMovieCameraIntent["framing"] | null = null;
  let bestDistance: number = Infinity;
  for (const framing of Object.keys(
    FRAMING_HEIGHT_FRACTION,
  ) as IAutoMovieCameraIntent["framing"][]) {
    const candidate: number = distance(FRAMING_HEIGHT_FRACTION[framing]);
    if (candidate < bestDistance) {
      best = framing;
      bestDistance = candidate;
    }
  }
  return best!;
};
