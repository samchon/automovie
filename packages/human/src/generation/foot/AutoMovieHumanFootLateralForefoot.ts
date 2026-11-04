import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The lateral border over the forefoot: the fifth metatarsal's side from the web ring back to the cuboid, the greatest across point of each of the fan's own section planes from the web ring to half of the stations (shares 0 to 0.5). Own centre: the fifth metatarsal head; the border runs close to the floor here (3 to 6 percent of the foot's length).
 */
export namespace AutoMovieHumanFootLateralForefoot {
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

  /** The border's height over the floor at the web ring (the region's first knot), foot lengths. */
  export function ringHeight(): number {
    return KNOTS[0]![3];
  }
}

/** The region's knots, [share, a, u, y / L, y / H]. Reference median, awaiting a published value. */
const KNOTS: readonly AutoMovieHumanFootGuide.IFanKnot[] = [
  [0, 0.6803, 0.9882, 0.0345, 0.1218],
  [0.05, 0.6435, 0.999, 0.0367, 0.1294],
  [0.1, 0.6117, 0.9968, 0.0409, 0.1436],
  [0.15, 0.5816, 0.9875, 0.0326, 0.1222],
  [0.2, 0.5517, 0.9773, 0.036, 0.1343],
  [0.25, 0.5206, 0.9664, 0.0402, 0.15],
  [0.3, 0.4868, 0.9518, 0.0444, 0.1658],
  [0.35, 0.4491, 0.9329, 0.0482, 0.1715],
  [0.4, 0.409, 0.9067, 0.0524, 0.1864],
  [0.45, 0.3667, 0.8789, 0.0575, 0.2028],
  [0.5, 0.3231, 0.858, 0.0625, 0.227],
];
