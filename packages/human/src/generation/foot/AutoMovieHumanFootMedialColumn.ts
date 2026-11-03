import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The medial border up the ankle's column: from the navicular to the ankle ring, past the medial malleolus (shares 0.7 to 1). Own centre: the medial malleolus's, which stands at 1.1 lateral malleolus heights (Gray).
 */
export namespace AutoMovieHumanFootMedialColumn {
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
   * two knots whose heights bracket it, at that height: the medial
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
  [0.7, 0.2911, 0.0442, 0.2503, 0.898],
  [0.75, 0.277, 0.0429, 0.2791, 0.9852],
  [0.8, 0.2577, 0.0428, 0.3013, 1.0678],
  [0.85, 0.255, 0.0508, 0.3302, 1.1736],
  [0.9, 0.2518, 0.0627, 0.3587, 1.2659],
  [0.95, 0.2527, 0.0782, 0.3864, 1.3638],
  [1, 0.2438, 0.0927, 0.4142, 1.4621],
];
