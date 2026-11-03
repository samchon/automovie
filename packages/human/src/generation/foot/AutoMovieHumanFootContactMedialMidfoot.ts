import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The medial edge of the plantar contact under the midfoot: the contact's boundary under the medial longitudinal arch (a = 0.5 to 0.2), the arch's footprint. Own centre: the navicular.
 */
export namespace AutoMovieHumanFootContactMedialMidfoot {
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
  [0.5, 0.6],
  [0.4, 0.515],
  [0.3, 0.405],
  [0.2, 0.29],
];
