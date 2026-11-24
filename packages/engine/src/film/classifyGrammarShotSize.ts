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
 */
export function classifyGrammarShotSize(
  frameOccupancy: number,
): IAutoMovieCameraIntent["framing"] {
  if (frameOccupancy <= 0)
    throw new Error("frameOccupancy must be finite and positive.");
  const logVisibleSubjects: number = -Math.log(frameOccupancy);
  const distance: (fraction: number) => number = (fraction: number): number =>
    Math.abs(logVisibleSubjects - Math.log(fraction));
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
}
