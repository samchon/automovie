import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The medial border over the navicular: the medial longitudinal arch's crown, the least across point of the fan's planes at shares 0.5 to 0.65, where the border rises from the cuneiforms to the column. Own centre: the navicular tuberosity.
 */
export namespace AutoMovieHumanFootMedialNavicular {
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
  [0.5, 0.3653, 0.0477, 0.1516, 0.5238],
  [0.55, 0.3304, 0.0475, 0.1453, 0.5411],
  [0.6, 0.3139, 0.0489, 0.1895, 0.7076],
  [0.65, 0.298, 0.0484, 0.2203, 0.796],
];
