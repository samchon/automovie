import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The lateral border over the heel: the calcaneus's lateral wall, the greatest across point of the fan's planes at shares 0.55 to 0.65. Own centre: the heel's. On every reference the extreme passes from this wall to the malleolus between 0.65 and 0.75 of the stations: a branch change, which the guide bridges from this region's last knot to the column's first (`AutoMovieHumanFootLateralColumn`).
 */
export namespace AutoMovieHumanFootLateralHeel {
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
}

/** The region's knots, [share, a, u, y / L, y / H]. Reference median, awaiting a published value. */
const KNOTS: readonly AutoMovieHumanFootGuide.IFanKnot[] = [
  [0.55, 0.276, 0.8411, 0.069, 0.2511],
  [0.6, 0.2221, 0.8275, 0.0651, 0.2321],
  [0.65, 0.1593, 0.8028, 0.082, 0.2774],
];
