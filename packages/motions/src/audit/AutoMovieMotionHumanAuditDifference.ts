import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * How far two displayed motions are apart: the largest distance between the
 * same joint centre of both at the same film second.
 *
 * Three properties of a motion are stated as a difference of two runs:
 *
 * - determinism: the same seed and the same chain give a difference of zero;
 * - seed sensitivity: another seed gives a difference above zero when the
 *   action varies, and still a clean audit;
 * - left and right symmetry: the motion of the mirrored order (every side
 *   swapped) is the mirror image of the first, so with `mirror` the second
 *   motion is reflected in the sagittal plane `x = plane` and its left bones
 *   are compared with the first one's right bones.
 *
 * The two motions are read over the shorter one's length, and the difference
 * of their lengths is reported beside the distance, since two motions that
 * agree while both last still differ when one is longer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measure, the three properties it serves and how lengths are treated.
 * @evidence contracts/development/implementation.md#principled-implementation A reflection in a sagittal plane negates the lateral coordinate about the plane and exchanges left with right, which is the definition of bilateral symmetry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk of the grid, one bone map per motion and instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bone the first motion displays is read, and a bone the second lacks is an error, not a skip.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames and bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the two motions handed in.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditDifference {
  /** How the second motion is read against the first. */
  export interface IOptions {
    /** The person in the second motion; the first one's subject by default. */
    other?: string;

    /** The lateral coordinate of the sagittal plane the second motion is reflected in; absent for no reflection. */
    mirror?: number;

    /** Grid samples per second; 24 by default. */
    rate?: number;
  }

  /** The reading of {@link measure}. */
  export interface IResult {
    /** The largest distance between the same joint centre, metres. */
    distance: IAutoMovieMotionHumanAuditMeasure;

    /** The absolute difference of the two lengths, seconds. */
    duration: number;
  }

  /**
   * Read how far two motions are apart.
   *
   * @param a The first motion.
   * @param b The second motion.
   * @param subject The person in the first motion.
   * @param options The second person, the reflection and the grid.
   * @returns The largest distance and the difference of lengths.
   * @throws {Error} When the second motion lacks a bone of the first.
   */
  export function measure(
    a: IAutoMovieMotionHumanAuditMotion,
    b: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    options: IOptions = {},
  ): IResult {
    const other: string = options.other ?? subject;
    let distance: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    for (const t of IAutoMovieMotionHumanAuditMotion.grid(
      0,
      Math.min(a.duration, b.duration),
      options.rate ?? 24,
    )) {
      const first: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = a.bones(
        subject,
        t,
      );
      const second: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        b.bones(other, t);
      for (const [bone, resolved] of first) {
        const twin: IAutoMovieResolvedBone | undefined = second.get(
          options.mirror === undefined ? bone : opposite(bone),
        );
        if (twin === undefined)
          throw new Error(`The second motion has no counterpart of ${bone}`);
        const p: IAutoMovieVector3 = resolved.worldPosition;
        const q: IAutoMovieVector3 = twin.worldPosition;
        const x: number =
          options.mirror === undefined ? q.x : 2 * options.mirror - q.x;
        const value: number = Math.hypot(p.x - x, p.y - q.y, p.z - q.z);
        if (value > distance.value)
          distance = { value, seconds: t, where: bone };
      }
    }
    return { distance, duration: Math.abs(a.duration - b.duration) };
  }

  /**
   * The bone on the other side of the body.
   *
   * @param bone A bone.
   * @returns Its left or right twin, or the bone itself on the midline.
   */
  export function opposite(bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone {
    if (bone.startsWith("left"))
      return `right${bone.slice(4)}` as AutoMovieHumanoidBone;
    if (bone.startsWith("right"))
      return `left${bone.slice(5)}` as AutoMovieHumanoidBone;
    return bone;
  }
}
