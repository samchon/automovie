import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditDifference,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * How far two displayed motions are apart: the largest distance between the
 * same joint centre of both at the same film second.
 *
 * Three properties of a motion are stated as a difference of two runs:
 *
 * - Determinism: the same seed and the same chain give a difference of zero;
 * - Seed sensitivity: another seed gives a difference above zero when the action
 *   varies, and still a clean audit;
 * - Left and right symmetry: the motion of the mirrored order (every side
 *   swapped) is the mirror image of the first, so with `mirror` the second
 *   motion is reflected in the sagittal plane `x = plane` and its left bones
 *   are compared with the first one's right bones.
 *
 * The two motions are read over the shorter one's length, and the difference of
 * their lengths is reported beside the distance, since two motions that agree
 * while both last still differ when one is longer.
 */
export namespace AutoMovieMotionHumanAuditDifference {
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
    options: IAutoMovieMotionHumanAuditDifference.IOptions = {},
  ): IAutoMovieMotionHumanAuditDifference.IResult {
    const other: string = options.other ?? subject;
    let distance: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    for (const t of HumanAuditMotion.grid(
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
