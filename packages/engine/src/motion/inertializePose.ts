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
import { inertializeOffset } from "./inertializeOffset";
import { samplePoseVelocity } from "./samplePoseVelocity";

/**
 * Inertialize a transition between two poses: the target motion plays from
 * the cut, and the source's offset from it decays to zero.
 *
 * At the cut the displayed pose was the source; from then on it is the target
 * plus an offset. Every rotation's offset `q_s q_t^-1` (each joint's
 * articulation and the root's rotation) decays as its rotation vector, per
 * axis, with the angular velocity offset, by {@link inertializeOffset} (Bollo,
 * GDC 2018), and is applied before the target rotation; the root translation
 * decays per axis the same way. Each is therefore continuous in value and
 * velocity at the cut, reaches the target exactly at its own clamped decay
 * time and never overshoots it.
 *
 * A ball joint is blended as a rotation, never per clinical angle: its
 * `[flexion, abduction, twist]` is an Euler chart, and at the chart's gimbal
 * nearly equal rotations have far apart triples, whose per-angle blend swings
 * the bone through poses neither side holds. The blended rotation is lowered
 * to angles through the rig ({@link poseJointCodec}), in the chart its range
 * of motion admits best. A joint with no offset left returns the target's own
 * angles untouched.
 *
 * A hinge or a two-axis joint (`poseJointCodec.ICodec.ball` false) is blended
 * per angle instead, each angle's offset decayed with its rate offset: the
 * rotations its angles span are a lower-dimensional set, and an offset
 * rotation applied to one of them leaves that set, which the lowering would
 * answer with motion on an axis the joint does not have. Its angles have no
 * gimbal inside their range, so the per-angle blend is the faithful one.
 *
 * The result is a pure function of the elapsed time and the target pose at
 * that time, so a caller can evaluate it on any grid. Contact corrections
 * (foot planting, grips) belong after it: an inertialized planted foot would
 * slide in world space (Holden, Dead Blending, 2023).
 *
 * @param source The displayed pose and its velocity at the cut.
 * @param target The target's pose and velocity at the cut.
 * @param duration Requested decay time, seconds; positive.
 * @param through Whether an offset heading to its target faster than the
 *   decay absorbs passes through it and returns, as `inertializeOffset`
 *   bounds, instead of stopping short of it within milliseconds: the "never
 *   overshoots" above is then given up for a bounded acceleration at the cut.
 * @param rig The rig the joints' angles are read through, the one both
 *   states' `spins` were sampled with; the default basis with rest-relative
 *   angles when omitted.
 * @returns The displayed pose for an elapsed time and the target pose at it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rotation-space method and why angles are not blended, its continuity and no-overshoot guarantees and where contact correction goes.
 * @evidence contracts/development/implementation.md#principled-implementation Quintic inertialization (Bollo 2018) with every orientation offset decayed as a rotation vector, the standard treatment of orientation offsets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Offsets are captured once; the returned function applies their decay before the target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bones present on one side only take their clinical neutral, zero, on the other.
 * @evidence contracts/development/implementation.md#efficient-algorithms Capture is linear in joints; each evaluation is linear in joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The captured offsets and the joint codec are shared by every evaluation of one transition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains only the captured offsets and the codec, bounded by the joint count.
 */
export function inertializePose(
  source: samplePoseVelocity.IState,
  target: samplePoseVelocity.IState,
  duration: number,
  through: boolean = false,
  rig?: IAutoMoviePoseRig,
): (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose {
  const codec: poseJointCodec.ICodec = poseJointCodec(rig);
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
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const axes = ["x", "y", "z"] as const;

  // The offset rotation `exp(decayed vector)` at an elapsed time, or null
  // once nothing of it is left.
  const decayed = (
    x: IAutoMovieVector3,
    v: IAutoMovieVector3,
    elapsed: number,
  ): IAutoMovieQuaternion | null => {
    const turn: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const k of axes)
      turn[k] = inertializeOffset(x[k], v[k], duration, elapsed, through).value;
    const angle: number = Math.hypot(turn.x, turn.y, turn.z);
    return angle < 1e-12
      ? null
      : Quaternion.fromAxisAngle(
          { x: turn.x / angle, y: turn.y / angle, z: turn.z / angle },
          (angle * 180) / Math.PI,
        );
  };

  const sa: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(
    source.pose,
  );
  const ta: Map<AutoMovieHumanoidBone, [number, number, number]> = angles(
    target.pose,
  );
  const still: [number, number, number] = [0, 0, 0];
  const offsets: Map<
    AutoMovieHumanoidBone,
    { x: IAutoMovieVector3; v: IAutoMovieVector3 }
  > = new Map();
  // Angle offsets and their rates, for the joints that are not ball joints.
  const hinged: Map<
    AutoMovieHumanoidBone,
    { x: [number, number, number]; v: [number, number, number] }
  > = new Map();
  for (const bone of new Set([...sa.keys(), ...ta.keys()])) {
    const s: [number, number, number] = sa.get(bone) ?? still;
    const t: [number, number, number] = ta.get(bone) ?? still;
    if (!codec.ball(bone)) {
      const rs: [number, number, number] =
        source.velocity.joints.get(bone) ?? still;
      const rt: [number, number, number] =
        target.velocity.joints.get(bone) ?? still;
      const x: [number, number, number] = [
        s[0] - t[0],
        s[1] - t[1],
        s[2] - t[2],
      ];
      const v: [number, number, number] = [
        rs[0] - rt[0],
        rs[1] - rt[1],
        rs[2] - rt[2],
      ];
      if (x.some((k: number): boolean => k !== 0) || v.some((k: number): boolean => k !== 0))
        hinged.set(bone, { x, v });
      continue;
    }
    const vs: IAutoMovieVector3 = source.velocity.spins.get(bone) ?? zero;
    const vt: IAutoMovieVector3 = target.velocity.spins.get(bone) ?? zero;
    const same: boolean = s[0] === t[0] && s[1] === t[1] && s[2] === t[2];
    const x: IAutoMovieVector3 = same
      ? zero
      : samplePoseVelocity.rotationVector(
          Quaternion.multiply(
            codec.rotation(bone, s),
            Quaternion.inverse(codec.rotation(bone, t)),
          ),
        );
    const v: IAutoMovieVector3 = {
      x: vs.x - vt.x,
      y: vs.y - vt.y,
      z: vs.z - vt.z,
    };
    if (same && v.x === 0 && v.y === 0 && v.z === 0) continue;
    offsets.set(bone, { x, v });
  }
  const st: IAutoMovieVector3 = source.pose.root?.translation ?? zero;
  const tt: IAutoMovieVector3 = target.pose.root?.translation ?? zero;
  const sr: IAutoMovieQuaternion =
    source.pose.root?.rotation ?? Quaternion.identity();
  const tr: IAutoMovieQuaternion =
    target.pose.root?.rotation ?? Quaternion.identity();
  const rotation0: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
    Quaternion.multiply(sr, Quaternion.inverse(tr)),
  );
  const spin0: IAutoMovieVector3 = {
    x: source.velocity.angular.x - target.velocity.angular.x,
    y: source.velocity.angular.y - target.velocity.angular.y,
    z: source.velocity.angular.z - target.velocity.angular.z,
  };
  return (elapsed: number, pose: IAutoMoviePose): IAutoMoviePose => {
    const now: Map<AutoMovieHumanoidBone, [number, number, number]> =
      angles(pose);
    const joints: IAutoMovieJointPose[] = [];
    for (const bone of new Set([
      ...now.keys(),
      ...offsets.keys(),
      ...hinged.keys(),
    ])) {
      const base: [number, number, number] = now.get(bone) ?? still;
      const h:
        | { x: [number, number, number]; v: [number, number, number] }
        | undefined = hinged.get(bone);
      if (h !== undefined) {
        const angle = (k: 0 | 1 | 2): number =>
          base[k] +
          inertializeOffset(h.x[k], h.v[k], duration, elapsed, through).value;
        joints.push({
          bone,
          flexion: angle(0),
          abduction: angle(1),
          twist: angle(2),
        });
        continue;
      }
      const o: { x: IAutoMovieVector3; v: IAutoMovieVector3 } | undefined =
        offsets.get(bone);
      const offset: IAutoMovieQuaternion | null =
        o === undefined ? null : decayed(o.x, o.v, elapsed);
      const shown: [number, number, number] =
        offset === null
          ? base
          : codec.angles(
              bone,
              Quaternion.normalize(
                Quaternion.multiply(offset, codec.rotation(bone, base)),
              ),
            );
      joints.push({
        bone,
        flexion: shown[0],
        abduction: shown[1],
        twist: shown[2],
      });
    }
    const t: IAutoMovieVector3 = pose.root?.translation ?? zero;
    const r: IAutoMovieQuaternion =
      pose.root?.rotation ?? Quaternion.identity();
    const translation: IAutoMovieVector3 = { ...t };
    for (const k of axes)
      translation[k] += inertializeOffset(
        st[k] - tt[k],
        source.velocity.linear[k] - target.velocity.linear[k],
        duration,
        elapsed,
        through,
      ).value;
    const offset: IAutoMovieQuaternion =
      decayed(rotation0, spin0, elapsed) ?? Quaternion.identity();
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
