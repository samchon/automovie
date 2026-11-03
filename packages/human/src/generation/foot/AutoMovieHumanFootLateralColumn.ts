import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The lateral border up the ankle's column: from the branch where the extreme leaves the heel's wall to the ankle ring, past the lateral malleolus (shares 0.75 to 1). Own centre: the lateral malleolus's, whose height is the lateral malleolus height input.
 *
 * Between the heel's wall (its last knot at share 0.65) and the malleolus
 * (the first knot here, 0.75) the sections' lateral extreme changes bone: at
 * the change it is the corner where the two prominences' outlines cross, a
 * place the skin does not follow, since the skin spans taut from one
 * prominence to the other. The guide therefore has no knot at the change
 * (the references' extreme at share 0.7, `[0.1794, 0.7559, 0.1527, 0.5386]`,
 * a step back along the foot between two steps forward): the station spline
 * bridges the two prominences from their own knots.
 */
export namespace AutoMovieHumanFootLateralColumn {
  /**
   * The region's knots as world points, front to back, read in the fan's own
   * planes (AutoMovieHumanFootGuide.fanned).
   *
   * @param frame The foot's frame.
   * @param line The web line.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame, line: AutoMovieHumanFootWebLine.IWebLine): Vec3[] {
    return AutoMovieHumanFootGuide.fanned(frame, line, KNOTS);
  }

  /**
   * The border's place at a height in lateral malleolus heights, between the
   * two knots whose heights bracket it, at that height: the lateral
   * malleolus's centre. Total: a height outside the knots takes the nearest
   * interval's end.
   *
   * @param frame The foot's frame.
   * @param height Height in lateral malleolus heights.
   */
  export function centre(frame: AutoMovieHumanFootFrame.IFrame, height: number): Vec3 {
    const i: number = Math.max(1, KNOTS.findIndex((q: AutoMovieHumanFootGuide.IFanKnot): boolean => q[4] >= height));
    const lo: AutoMovieHumanFootGuide.IFanKnot = KNOTS[i - 1]!;
    const hi: AutoMovieHumanFootGuide.IFanKnot = KNOTS[i]!;
    const f: number = Math.min(1, Math.max(0, (height - lo[4]) / (hi[4] - lo[4] || 1)));

    return frame.at(lo[1] + f * (hi[1] - lo[1]), lo[2] + f * (hi[2] - lo[2]), height * frame.H);
  }
}

/** The region's knots, [share, a, u, y / L, y / H]. Reference median, awaiting a published value. */
const KNOTS: readonly AutoMovieHumanFootGuide.IFanKnot[] = [
  [0.75, 0.2298, 0.7308, 0.2417, 0.862],
  [0.8, 0.2146, 0.7366, 0.2731, 0.964],
  [0.85, 0.2015, 0.73, 0.3106, 1.0962],
  [0.9, 0.1992, 0.7237, 0.346, 1.2212],
  [0.95, 0.1965, 0.7067, 0.3802, 1.3424],
  [1, 0.1935, 0.6933, 0.4142, 1.4621],
];
