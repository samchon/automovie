import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * A pose and its rate of change at one instant, read from the pure function
 * of time that produces it.
 *
 * The rate is the symmetric difference `(f(t + h) - f(t - h)) / 2h` of every
 * clinical angle and of the root translation, and the root's angular velocity
 * is the rotation vector of `q(t + h) q(t - h)^-1` over `2h`. Differencing
 * the source function, never emitted frames, keeps the estimate free of the
 * frame grid: its error is `O(h^2)` times the third derivative, a second-order
 * central difference. An angle absent from either side counts as zero, its
 * clinical neutral.
 *
 * @param sample The pose as a pure function of seconds.
 * @param seconds The instant.
 * @param step Half the difference interval `h`, seconds; 1 ms by default.
 * @returns The pose at the instant and its velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the estimator, its error order, the absent-angle meaning and the units.
 * @evidence contracts/development/implementation.md#principled-implementation Second-order central difference on the source function; angular velocity by the quaternion log map.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three samples, then per-joint and root differences.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive step throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three samples and linear work in joints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function samplePoseVelocity(
  sample: (seconds: number) => IAutoMoviePose,
  seconds: number,
  step: number = 1e-3,
): samplePoseVelocity.IState {
  if (!(step > 0)) throw new Error("A velocity step is positive");
  const before: IAutoMoviePose = sample(seconds - step);
  const pose: IAutoMoviePose = sample(seconds);
  const after: IAutoMoviePose = sample(seconds + step);
  const angles = (
    p: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, [number, number, number]> =>
    new Map(
      p.joints.map(
        (
          j: IAutoMovieJointPose,
        ): [AutoMovieHumanoidBone, [number, number, number]] => [
          j.bone,
          [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
        ],
      ),
    );
  const a: Map<AutoMovieHumanoidBone, [number, number, number]> =
    angles(before);
  const b: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(after);
  const joints: Map<AutoMovieHumanoidBone, [number, number, number]> =
    new Map();
  for (const bone of new Set([...a.keys(), ...b.keys()])) {
    const p: [number, number, number] = a.get(bone) ?? [0, 0, 0];
    const q: [number, number, number] = b.get(bone) ?? [0, 0, 0];
    joints.set(bone, [
      (q[0] - p[0]) / (2 * step),
      (q[1] - p[1]) / (2 * step),
      (q[2] - p[2]) / (2 * step),
    ]);
  }
  const t0: IAutoMovieVector3 = before.root?.translation ?? {
    x: 0,
    y: 0,
    z: 0,
  };
  const t1: IAutoMovieVector3 = after.root?.translation ?? { x: 0, y: 0, z: 0 };
  const r0: IAutoMovieQuaternion =
    before.root?.rotation ?? Quaternion.identity();
  const r1: IAutoMovieQuaternion =
    after.root?.rotation ?? Quaternion.identity();
  const turn: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
    Quaternion.multiply(r1, Quaternion.inverse(r0)),
  );
  return {
    pose,
    velocity: {
      joints,
      linear: {
        x: (t1.x - t0.x) / (2 * step),
        y: (t1.y - t0.y) / (2 * step),
        z: (t1.z - t0.z) / (2 * step),
      },
      angular: {
        x: turn.x / (2 * step),
        y: turn.y / (2 * step),
        z: turn.z / (2 * step),
      },
    },
  };
}

/**
 * Companion types and helpers of {@link samplePoseVelocity}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit and frame.
 * @evidence contracts/development/design.md#principled-representation Clinical degrees per second per bone and the root's linear and angular velocity in the pose's parent frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What inertialization and the motion audits read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface pose.
 */
export namespace samplePoseVelocity {
  /** A pose's velocity. */
  export interface IVelocity {
    /** Flexion, abduction and twist rates per bone, degrees per second. */
    joints: Map<AutoMovieHumanoidBone, [number, number, number]>;

    /** Root translation rate, metres per second, the pose's parent frame. */
    linear: IAutoMovieVector3;

    /** Root angular velocity, radians per second, the pose's parent frame. */
    angular: IAutoMovieVector3;
  }

  /** A pose with its velocity. */
  export interface IState {
    /** The pose. */
    pose: IAutoMoviePose;

    /** Its velocity. */
    velocity: IVelocity;
  }

  /**
   * The rotation vector (axis times angle in radians) of a unit quaternion,
   * taking the shorter of the two equivalent rotations.
   *
   * @param q A unit quaternion.
   * @returns Its rotation vector.
   */
  export function rotationVector(q: IAutoMovieQuaternion): IAutoMovieVector3 {
    const sign: number = q.w < 0 ? -1 : 1;
    const w: number = Math.min(1, sign * q.w);
    const sine: number = Math.hypot(q.x, q.y, q.z);
    if (sine < 1e-12)
      return { x: 2 * sign * q.x, y: 2 * sign * q.y, z: 2 * sign * q.z };
    const angle: number = 2 * Math.atan2(sine, w);
    const k: number = (sign * angle) / sine;
    return { x: q.x * k, y: q.y * k, z: q.z * k };
  }
}
