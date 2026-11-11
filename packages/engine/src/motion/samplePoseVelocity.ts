import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePoseRig } from "../kinematics/IAutoMoviePoseRig";
import { poseJointCodec } from "../kinematics/poseJointCodec";
import { Quaternion } from "../math/Quaternion";

/**
 * A pose and its rate of change at one instant, read from the pure function
 * of time that produces it.
 *
 * Read from both sides, the rate is the symmetric difference
 * `(f(t + h) - f(t - h)) / 2h` of every clinical angle and of the root
 * translation, and the root's angular velocity is the rotation vector of
 * `q(t + h) q(t - h)^-1` over `2h`. A motion that only exists on one side of
 * the instant (the action a cut ends, the action a cut begins) is read from
 * that side alone, by the three-point difference
 * `s (-3 f(t) + 4 f(t + s h) - f(t + 2 s h)) / 2h` with `s` the side's sign,
 * the rotation vectors taken from `q(t)`: a symmetric difference would
 * average the motion's rate with whatever its function returns across the
 * instant. Differencing the source function, never emitted frames, keeps the
 * estimate free of the frame grid: either difference is second order, its
 * error `O(h^2)` times the third derivative. An angle absent from a sample
 * counts as zero, its clinical neutral.
 *
 * Each joint's angular velocity (`spins`) is read the way the root's is, from
 * the rotation vectors of its articulation at the same samples
 * ({@link poseJointCodec}), never from the angle rates: at an angle chart's
 * gimbal the angle rates of a smooth rotation are unbounded, while its angular
 * velocity is not.
 *
 * @param sample The pose as a pure function of seconds.
 * @param seconds The instant.
 * @param step The difference interval `h`, seconds; 1 ms by default.
 * @param side Which side of the instant the motion is read from: both by default.
 * @param rig The rig the joints' angles are read through for `spins`; the
 *   default basis with rest-relative angles when omitted.
 * @returns The pose at the instant and its velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both estimators, when each applies, their error order, the absent-angle meaning and the units.
 * @evidence contracts/development/implementation.md#principled-implementation Second-order central and one-sided differences on the source function; angular velocity by the quaternion log map.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three samples, then one weighted difference per channel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive step throws; a one-sided motion is never sampled across its instant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three samples and linear work in joints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function samplePoseVelocity(
  sample: (seconds: number) => IAutoMoviePose,
  seconds: number,
  step: number = 1e-3,
  side: samplePoseVelocity.Side = "both",
  rig?: IAutoMoviePoseRig,
): samplePoseVelocity.IState {
  if (!(step > 0)) throw new Error("A velocity step is positive");
  const pose: IAutoMoviePose = sample(seconds);

  // Two samples beside the instant and the weights of the difference
  // `(near * f(a) + far * f(b) + here * f(t)) / 2h`.
  const sign: number = side === "before" ? -1 : 1;
  const a: IAutoMoviePose = sample(seconds + sign * step);
  const b: IAutoMoviePose = sample(
    side === "both" ? seconds - step : seconds + 2 * sign * step,
  );
  const near: number = side === "both" ? 1 : 4 * sign;
  const far: number = side === "both" ? -1 : -sign;
  const here: number = side === "both" ? 0 : -3 * sign;
  const rate = (x: number, y: number, z: number): number =>
    (near * x + far * y + here * z) / (2 * step);

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
  const aa: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(a);
  const ba: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(b);
  const pa: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(pose);
  const joints: Map<AutoMovieHumanoidBone, [number, number, number]> =
    new Map();
  for (const bone of new Set([...aa.keys(), ...ba.keys(), ...pa.keys()])) {
    const x: [number, number, number] = aa.get(bone) ?? [0, 0, 0];
    const y: [number, number, number] = ba.get(bone) ?? [0, 0, 0];
    const z: [number, number, number] = pa.get(bone) ?? [0, 0, 0];
    joints.set(bone, [
      rate(x[0], y[0], z[0]),
      rate(x[1], y[1], z[1]),
      rate(x[2], y[2], z[2]),
    ]);
  }

  // Joint spins: the rotation vectors of each articulation at the two samples
  // beside the instant, from the same origin sample as the root's below.
  const codec: poseJointCodec.ICodec = poseJointCodec(rig);
  const still: [number, number, number] = [0, 0, 0];
  const spins: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of joints.keys()) {
    const from: IAutoMovieQuaternion = Quaternion.inverse(
      codec.rotation(bone, (side === "both" ? ba : pa).get(bone) ?? still),
    );
    const swing = (
      angles: Map<AutoMovieHumanoidBone, [number, number, number]>,
    ): IAutoMovieVector3 =>
      samplePoseVelocity.rotationVector(
        Quaternion.multiply(
          codec.rotation(bone, angles.get(bone) ?? still),
          from,
        ),
      );
    const x: IAutoMovieVector3 = swing(aa);
    const y: IAutoMovieVector3 = swing(ba);
    spins.set(bone, {
      x: rate(x.x, y.x, 0),
      y: rate(x.y, y.y, 0),
      z: rate(x.z, y.z, 0),
    });
  }

  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const at: IAutoMovieVector3 = a.root?.translation ?? zero;
  const bt: IAutoMovieVector3 = b.root?.translation ?? zero;
  const pt: IAutoMovieVector3 = pose.root?.translation ?? zero;

  // Rotation vectors are taken from the far sample when reading both sides,
  // where the near one's is the whole turn, and from the instant otherwise.
  const origin: IAutoMovieQuaternion = Quaternion.inverse(
    (side === "both" ? b : pose).root?.rotation ?? Quaternion.identity(),
  );
  const turn = (p: IAutoMoviePose): IAutoMovieVector3 =>
    samplePoseVelocity.rotationVector(
      Quaternion.multiply(p.root?.rotation ?? Quaternion.identity(), origin),
    );
  const ar: IAutoMovieVector3 = turn(a);
  const br: IAutoMovieVector3 = turn(b);
  return {
    pose,
    velocity: {
      joints,
      spins,
      linear: {
        x: rate(at.x, bt.x, pt.x),
        y: rate(at.y, bt.y, pt.y),
        z: rate(at.z, bt.z, pt.z),
      },
      angular: {
        x: rate(ar.x, br.x, 0),
        y: rate(ar.y, br.y, 0),
        z: rate(ar.z, br.z, 0),
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
  /**
   * The side of an instant a motion is read from: `before` for a motion that
   * ends there, `after` for one that begins there, `both` for one that runs
   * through it.
   */
  export type Side = "both" | "before" | "after";

  /** A pose's velocity. */
  export interface IVelocity {
    /** Flexion, abduction and twist rates per bone, degrees per second. */
    joints: Map<AutoMovieHumanoidBone, [number, number, number]>;

    /**
     * Each joint's angular velocity, radians per second, in the frame its
     * articulation is applied in (after the bone's rest rotation).
     */
    spins: Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

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
