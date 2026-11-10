import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { inertializeOffset } from "./inertializeOffset";
import { samplePoseVelocity } from "./samplePoseVelocity";

/**
 * Inertialize a transition between two poses: the target motion plays from
 * the cut, and the source's offset from it decays to zero.
 *
 * At the cut the displayed pose was the source; from then on it is the target
 * plus an offset per channel. Every clinical angle's offset and offset
 * velocity decay independently by {@link inertializeOffset} (Bollo, GDC
 * 2018), so each channel is continuous in value and velocity at the cut,
 * reaches the target exactly at its own clamped decay time and never
 * overshoots it. The root translation decays per axis the same way. The root
 * rotation's offset `q_s q_t^-1` decays as its rotation vector, per axis, with
 * the angular velocity offset, and is applied before the target rotation.
 *
 * The result is a pure function of the elapsed time and the target pose at
 * that time, so a caller can evaluate it on any grid. Contact corrections
 * (foot planting, grips) belong after it: an inertialized planted foot would
 * slide in world space (Holden, Dead Blending, 2023).
 *
 * @param source The displayed pose and its velocity at the cut.
 * @param target The target's pose and velocity at the cut.
 * @param duration Requested decay time, seconds; positive.
 * @returns The displayed pose for an elapsed time and the target pose at it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-channel method, its continuity and no-overshoot guarantees, the root rotation's treatment and where contact correction goes.
 * @evidence contracts/development/implementation.md#principled-implementation Per-channel quintic inertialization (Bollo 2018) with the rotation offset decayed as a rotation vector, the standard treatment of orientation offsets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Offsets are captured once; the returned function adds their decay to the target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bones present on one side only take their clinical neutral, zero, on the other.
 * @evidence contracts/development/implementation.md#efficient-algorithms Capture is linear in joints; each evaluation is linear in joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The captured offsets are shared by every evaluation of one transition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains only the captured offsets, bounded by the joint count.
 */
export function inertializePose(
  source: samplePoseVelocity.IState,
  target: samplePoseVelocity.IState,
  duration: number,
): (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose {
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
  const sa: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(
    source.pose,
  );
  const ta: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(
    target.pose,
  );
  const offsets: Map<AutoMovieHumanoidBone, { x: number[]; v: number[] }> =
    new Map();
  for (const bone of new Set([...sa.keys(), ...ta.keys()])) {
    const s: [number, number, number] = sa.get(bone) ?? [0, 0, 0];
    const t: [number, number, number] = ta.get(bone) ?? [0, 0, 0];
    const vs: [number, number, number] = source.velocity.joints.get(bone) ?? [
      0, 0, 0,
    ];
    const vt: [number, number, number] = target.velocity.joints.get(bone) ?? [
      0, 0, 0,
    ];
    offsets.set(bone, {
      x: [0, 1, 2].map((k: number): number => s[k]! - t[k]!),
      v: [0, 1, 2].map((k: number): number => vs[k]! - vt[k]!),
    });
  }
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const st: IAutoMovieVector3 = source.pose.root?.translation ?? zero;
  const tt: IAutoMovieVector3 = target.pose.root?.translation ?? zero;
  const sr: IAutoMovieQuaternion =
    source.pose.root?.rotation ?? Quaternion.identity();
  const tr: IAutoMovieQuaternion =
    target.pose.root?.rotation ?? Quaternion.identity();
  const rotation0: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
    Quaternion.multiply(sr, Quaternion.inverse(tr)),
  );
  const axes = ["x", "y", "z"] as const;
  return (elapsed: number, pose: IAutoMoviePose): IAutoMoviePose => {
    const now: Map<AutoMovieHumanoidBone, [number, number, number]> =
      angles(pose);
    const joints: IAutoMovieJointPose[] = [];
    for (const bone of new Set([...now.keys(), ...offsets.keys()])) {
      const base: [number, number, number] = now.get(bone) ?? [0, 0, 0];
      const o: { x: number[]; v: number[] } | undefined = offsets.get(bone);
      const at = (k: number): number =>
        base[k]! +
        (o === undefined
          ? 0
          : inertializeOffset(o.x[k]!, o.v[k]!, duration, elapsed).value);
      joints.push({ bone, flexion: at(0), abduction: at(1), twist: at(2) });
    }
    const t: IAutoMovieVector3 = pose.root?.translation ?? zero;
    const r: IAutoMovieQuaternion =
      pose.root?.rotation ?? Quaternion.identity();
    const translation: IAutoMovieVector3 = { ...t };
    const turn: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const k of axes) {
      translation[k] += inertializeOffset(
        st[k] - tt[k],
        source.velocity.linear[k] - target.velocity.linear[k],
        duration,
        elapsed,
      ).value;
      turn[k] = inertializeOffset(
        rotation0[k],
        source.velocity.angular[k] - target.velocity.angular[k],
        duration,
        elapsed,
      ).value;
    }
    const angle: number = Math.hypot(turn.x, turn.y, turn.z);
    const offset: IAutoMovieQuaternion =
      angle < 1e-12
        ? Quaternion.identity()
        : Quaternion.fromAxisAngle(
            { x: turn.x / angle, y: turn.y / angle, z: turn.z / angle },
            (angle * 180) / Math.PI,
          );
    return {
      skeleton: pose.skeleton,
      root: {
        translation,
        rotation: Quaternion.normalize(Quaternion.multiply(offset, r)),
        scale: pose.root?.scale ?? { x: 1, y: 1, z: 1 },
      },
      joints,
    };
  };
}
