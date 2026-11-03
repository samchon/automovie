import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The instep's crest over the forefoot: the dorsal profile of the foot from the
 * first toe web back over the metatarsals to the midfoot (a = 0.86 to 0.5), the
 * summit line of each section. Own centre: the second metatarsal head, the
 * line's highest and most constant part. Its knots are reference medians (over
 * f1, f2, m1 and m2, read by exact plane cuts of their left feet), `[a, u, y / L]`
 * in foot lengths and breadths and foot lengths, awaiting a published value.
 */
export namespace AutoMovieHumanFootCrestForefoot {
  /**
   * The region's knots as world points, front to back.
   *
   * @param frame The foot's frame.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame): Vec3[] {
    return KNOTS.map((q: readonly [number, number, number]): Vec3 => frame.at(q[0], q[1], q[2] * frame.L));
  }

  /**
   * The crest's height over the floor at a place along the foot, in foot
   * lengths: the monotone cubic through the region's knots, which the web line
   * reads to move each cleft back by its margin radius.
   *
   * @param a Place along the foot from the rearmost point, foot lengths.
   */
  export function depth(a: number): number {
    return AutoMovieHumanMonotoneCubic.interpolate(
      KNOTS.map((q: readonly [number, number, number]): [number, number] => [q[0], q[2]]),
      a,
    );
  }

  /**
   * The crest's across place at a place along the foot, in foot breadths
   * from the forefoot's medial extreme: the monotone cubic through the
   * region's knots.
   *
   * @param a Place along the foot from the rearmost point, foot lengths.
   */
  export function across(a: number): number {
    return AutoMovieHumanMonotoneCubic.interpolate(
      KNOTS.map((q: readonly [number, number, number]): [number, number] => [q[0], q[1]]),
      a,
    );
  }
}

/** The region's knots, front first: `[a, u, y / L]`. Reference median. */
const KNOTS: readonly (readonly [number, number, number])[] = [
  [0.86, 0.19, 0.1],
  [0.8, 0.19, 0.121],
  [0.75, 0.195, 0.146],
  [0.7, 0.26, 0.164],
  [0.65, 0.2965, 0.187],
  [0.6, 0.3, 0.21],
  [0.55, 0.3245, 0.233],
  [0.5, 0.37, 0.258],
];
