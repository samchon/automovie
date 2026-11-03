import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The lateral edge of the plantar contact under the heel: the contact's boundary round the calcaneal tuberosity up to the contact's rear end (a = 0.1 and 0.075), where the heel's corner takes over (AutoMovieHumanFootHeelCorner). Own centre: the calcaneal tuberosity.
 */
export namespace AutoMovieHumanFootContactLateralHeel {
  /**
   * The region's knots on the floor as world points, front to back.
   *
   * @param frame The foot's frame.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame): Vec3[] {
    return KNOTS.map((q: readonly [number, number]): Vec3 => frame.at(q[0], q[1], 0));
  }
}

/** The region's knots on the floor, front first: [a, u] in foot lengths and breadths. Reference median. */
const KNOTS: readonly (readonly [number, number])[] = [
  [0.1, 0.61],
  [0.075, 0.58],
];
