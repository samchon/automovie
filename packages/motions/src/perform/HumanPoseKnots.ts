import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A person's displayed poses as a track on a fixed grid of film seconds: a
 * pose is evaluated exactly at the grid's knots and read between two knots
 * by interpolation.
 *
 * The grid is the film's, not a query's: `RATE` knots a second from second
 * zero, so the frame instants of 24, 30, 60 and 120 frames a second are all
 * knots and are shown exactly as evaluated, two films of the same
 * performance share their knots, and a reader between knots (an integrator's
 * stage, a finite difference, a bisection of a contact instant) costs the
 * knots around it, shared with every other reader of that interval, rather
 * than a pose of its own.
 *
 * Between knots each joint's clinical angle and each coordinate of the
 * root's translation runs on the monotone cubic Hermite interpolant through
 * the two knots before and the two after (Fritsch and Carlson 1980, SIAM J.
 * Numer. Anal. 17, 238-246): continuous in value and rate across knots, and
 * never outside the two knots it runs between, so a joint standing at a
 * limit of its range at both knots stays on it between them. Angles are
 * unwrapped onto the shorter way round from the knot before. The root's
 * rotation runs along the geodesic between its two knots. An angle absent at
 * all four knots (at rest) stays absent; absent at some, it is read as zero
 * there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grid, why frame instants are knots, what a reader between knots costs and how each part of a pose runs between knots.
 * @evidence contracts/development/design.md#principled-representation A displayed motion as samples on a fixed film grid with a stated interpolant, the form sampled animation takes; the grid depends on no query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rate, the place of a second on the grid and the pose between four knots: what the displayed evaluator needs to read between its exact knots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No adaptive knots, tolerance test or per-query grid: two readers of one interval read the same knots and the same interpolant.
 */
export namespace HumanPoseKnots {
  /** Knots a film second. */
  export const RATE: number = 120;

  /** How near a knot, in knots, a second is the knot itself: the binary rounding of `k / RATE` and of sums of frame durations. */
  const ON: number = 1e-6;

  /**
   * Where a film second lies on the grid.
   *
   * @param seconds Film seconds.
   * @returns Null on a knot (the second is shown as evaluated); else the four knots around it as film seconds, the second lying between the middle two, and the share of the way from the second knot to the third.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the null on a knot, the four knots and the share.
   * @evidence contracts/development/implementation.md#principled-implementation The grid is `k / RATE` from second zero; a second within a millionth of a knot interval of a knot is that knot, which absorbs the binary rounding of frame instants.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scaling, one rounding test and four knot seconds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A knot keeps the second asked, not a rounded one, so a frame instant is evaluated at exactly its own second.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function locate(seconds: number): { knots: [number, number, number, number]; share: number } | null {
    const at: number = seconds * RATE;
    if (Math.abs(at - Math.round(at)) <= ON) return null;
    const low: number = Math.floor(at);
    return {
      knots: [(low - 1) / RATE, low / RATE, (low + 1) / RATE, (low + 2) / RATE],
      share: at - low,
    };
  }

  /**
   * The pose a share of the way from the second of four consecutive knots'
   * poses to the third.
   *
   * @param poses The poses at the four knots.
   * @param share The share of the way, strictly between 0 and 1.
   * @returns The pose between.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four knots, the share and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each angle and root coordinate runs on the monotone cubic Hermite interpolant of its four knots (Fritsch and Carlson 1980), which is continuous in rate and stays between the knots it joins; the root's rotation runs along the geodesic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Joints are matched by bone across the four knots, then each angle is one interpolant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint named at only some knots is read at rest elsewhere rather than dropped; an angle is unwrapped the shorter way round before it is interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pose's joints, three name tables a read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its four poses.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the pose returned is the caller's.
   */
  export function between(
    poses: readonly [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose, IAutoMoviePose],
    share: number,
  ): IAutoMoviePose {
    const [before, from, to, after] = poses;
    const tables: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>[] = [before, to, after].map(
      (pose: IAutoMoviePose): Map<AutoMovieHumanoidBone, IAutoMovieJointPose> => {
        const table: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
        for (const joint of pose.joints) table.set(joint.bone, joint);
        return table;
      },
    );
    const seen: Set<AutoMovieHumanoidBone> = new Set();
    const joints: IAutoMovieJointPose[] = [];
    const add = (bone: AutoMovieHumanoidBone, at: IAutoMovieJointPose | undefined): void => {
      if (seen.has(bone)) return;
      seen.add(bone);
      const quartet: (IAutoMovieJointPose | undefined)[] = [tables[0]!.get(bone), at, tables[1]!.get(bone), tables[2]!.get(bone)];
      joints.push({
        bone,
        flexion: angle(quartet.map((j: IAutoMovieJointPose | undefined): number | null => j?.flexion ?? null), share),
        abduction: angle(quartet.map((j: IAutoMovieJointPose | undefined): number | null => j?.abduction ?? null), share),
        twist: angle(quartet.map((j: IAutoMovieJointPose | undefined): number | null => j?.twist ?? null), share),
      });
    };
    for (const joint of from.joints) add(joint.bone, joint);
    // Joints only the knot after names leave rest toward it.
    for (const joint of to.joints) add(joint.bone, undefined);
    const root: IAutoMoviePose["root"] =
      from.root === null || to.root === null
        ? (share < 0.5 ? from.root : to.root)
        : {
            translation: point(
              [before.root?.translation ?? from.root.translation, from.root.translation,
                to.root.translation, after.root?.translation ?? to.root.translation],
              share,
            ),
            rotation: Quaternion.slerp(from.root.rotation, to.root.rotation, share),
            scale: point([from.root.scale, from.root.scale, to.root.scale, to.root.scale], share),
          };
    return { skeleton: from.skeleton, root, joints };
  }

  /** One clinical angle between its middle two of four knots, degrees, unwrapped from the second. */
  function angle(values: readonly (number | null)[], share: number): number | null {
    if (values.every((value: number | null): boolean => value === null)) return null;
    const at: number = values[1] ?? 0;
    const near = (value: number | null): number => {
      const turn: number = (value ?? 0) - at;
      return at + turn - 360 * Math.round(turn / 360);
    };
    return hermite(near(values[0]!), at, near(values[2]!), near(values[3]!), share);
  }

  /** A point between its middle two of four knots, each coordinate on the same interpolant. */
  function point(values: readonly [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3], share: number): IAutoMovieVector3 {
    return {
      x: hermite(values[0].x, values[1].x, values[2].x, values[3].x, share),
      y: hermite(values[0].y, values[1].y, values[2].y, values[3].y, share),
      z: hermite(values[0].z, values[1].z, values[2].z, values[3].z, share),
    };
  }

  /**
   * The monotone cubic Hermite interpolant on equal knots: the value a share
   * of the way from `b` to `c`, with each end's rate the harmonic mean of the
   * two secants meeting there, or none where they differ in sign (Fritsch and
   * Carlson 1980; equal knots make the weighted harmonic mean the plain one).
   */
  function hermite(a: number, b: number, c: number, d: number, share: number): number {
    const rate = (left: number, right: number): number =>
      left * right > 0 ? (2 * left * right) / (left + right) : 0;
    const m0: number = rate(b - a, c - b);
    const m1: number = rate(c - b, d - c);
    const s2: number = share * share;
    const s3: number = s2 * share;
    return (2 * s3 - 3 * s2 + 1) * b + (s3 - 2 * s2 + share) * m0 +
      (-2 * s3 + 3 * s2) * c + (s3 - s2) * m1;
  }
}
