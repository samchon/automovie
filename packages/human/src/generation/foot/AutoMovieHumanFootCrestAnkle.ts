import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The instep's crest up the ankle's front: the dorsal profile from the midfoot
 * over the talus's neck to the ankle ring, in the column. Own centre: the
 * ankle's, at the lateral malleolus height. Its knots are reference medians,
 * `[a, u, eta]` in foot lengths, foot breadths and lateral malleolus heights;
 * the last stands on the ring. Awaiting a published value.
 */
export namespace AutoMovieHumanFootCrestAnkle {
  /**
   * The region's knots as world points, front to back.
   *
   * @param frame The foot's frame.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame): Vec3[] {
    return KNOTS.map((q: readonly [number, number, number]): Vec3 => frame.at(q[0], q[1], q[2] * frame.H));
  }
}

/** The region's knots, lowest first: `[a, u, eta]`. Reference median. */
const KNOTS: readonly (readonly [number, number, number])[] = [
  [0.406, 0.39, 1.2],
  [0.377, 0.39, 1.4621],
];
