import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The lateral edge of the plantar contact under the ball: the contact's boundary round the fifth metatarsal head, from the web ring to the cuboid (a = 0.86 to 0.6). Own centre: the fifth metatarsal head.
 */
export namespace AutoMovieHumanFootContactLateralBall {
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
  [0.86, 0.6],
  [0.8, 0.61],
  [0.75, 0.77],
  [0.7, 0.91],
  [0.6, 0.93],
];
