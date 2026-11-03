import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The medial border over the forefoot: the first ray's side from the web ring back to the cuneiforms, the least across point of each of the fan's own section planes from the web ring to 0.45 of the stations. Own centre: the first metatarsal head.
 */
export namespace AutoMovieHumanFootMedialForefoot {
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
  [0, 0.8598, 0.0213, 0.0429, 0.1606],
  [0.05, 0.7926, 0.0124, 0.0504, 0.184],
  [0.1, 0.7293, 0.0001, 0.0585, 0.2096],
  [0.15, 0.6657, 0.0119, 0.0651, 0.2366],
  [0.2, 0.6054, 0.0289, 0.0827, 0.3071],
  [0.25, 0.55, 0.0405, 0.0996, 0.3621],
  [0.3, 0.5025, 0.0431, 0.1139, 0.4218],
  [0.35, 0.4628, 0.0417, 0.1181, 0.437],
  [0.4, 0.4291, 0.0422, 0.123, 0.4551],
  [0.45, 0.3976, 0.0452, 0.1287, 0.4751],
];
