import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMoviePoseRig,
  IAutoMoviePoseState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { Quaternion } from "../../math/Quaternion";
import { inertializeOffset } from "./inertializeOffset";
import { samplePoseVelocity as samplePoseVelocityImplementation } from "./samplePoseVelocity";

/*
 * Inertialize a transition between two poses: the target motion plays from the
 * cut, and the source's offset from it decays to zero.
 *
 * At the cut the displayed pose was the source; from then on it is the target
 * plus an offset. Every rotation's offset `q_s q_t^-1` (each joint's
 * articulation and the root's rotation) decays as its rotation vector, per
 * axis, with the angular velocity offset, by inertializeOffset (Bollo,
 * GDC 2018), and is applied before the target rotation; the root translation
 * decays per axis the same way. Each is therefore continuous in value and
 * velocity at the cut, reaches the target exactly at its own clamped decay time
 * and never overshoots it.
 *
 * A ball joint is blended as a rotation, never per clinical angle: its
 * `[flexion, abduction, twist]` is an Euler chart, and at the chart's gimbal
 * nearly equal rotations have far apart triples, whose per-angle blend swings
 * the bone through poses neither side holds. The blended rotation is lowered to
 * angles through the rig (AutoMovieEngineKinematics.poseJointCodec), in the chart its range of
 * motion admits best. A joint with no offset left returns the target's own
 * angles untouched.
 *
 * A hinge or a two-axis joint (`IAutoMoviePoseJointCodec.ICodec.ball` false) is blended
 * per angle instead, each angle's offset decayed with its rate offset: the
 * rotations its angles span are a lower-dimensional set, and an offset rotation
 * applied to one of them leaves that set, which the lowering would answer with
 * motion on an axis the joint does not have. Its angles have no gimbal inside
 * their range, so the per-angle blend is the faithful one.
 *
 * The result is a pure function of the elapsed time and the target pose at that
 * time, so a caller can evaluate it on any grid. Contact corrections (foot
 * planting, grips) belong after it: an inertialized planted foot would slide in
 * world space (Holden, Dead Blending, 2023).
 * Parameter source: The displayed pose and its velocity at the cut.
 * Parameter target: The target's pose and velocity at the cut.
 * Parameter duration: Requested decay time, seconds; positive.
 * Parameter through: Whether an offset heading to its target faster than the decay
 * absorbs passes through it and returns, as `inertializeOffset` bounds,
 * instead of stopping short of it within milliseconds: the "never overshoots"
 * above is then given up for a bounded acceleration at the cut.
 * Parameter rig: The rig the joints' angles are read through, the one both states'
 * `spins` were sampled with; the default basis with rest-relative angles when
 * omitted.
 * Parameter prepared: Optional same-rig codec or lazy getter shared with the actual
 * source/target rate sampling; the concrete codec retains the existing offset
 * lifetime.
 * Returns: The displayed pose for an elapsed time and the target pose at it.
 */
export function inertializePose(
  source: IAutoMoviePoseState,
  target: IAutoMoviePoseState,
  duration: number,
  through: boolean = false,
  rig?: IAutoMoviePoseRig,
  prepared?:
    | IAutoMoviePoseJointCodec.ICodec
    | (() => IAutoMoviePoseJointCodec.ICodec),
): (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose {
  const codec: IAutoMoviePoseJointCodec.ICodec =
    prepared === undefined
      ? AutoMovieEngineKinematics.poseJointCodec(rig)
      : typeof prepared === "function"
        ? prepared()
        : prepared;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  const sa: Map<AutoMovieHumanoidBone, [number, number, number]> =
    AutoMovieEngineKinematics.indexPoseJoints(source.pose);
  const ta: Map<AutoMovieHumanoidBone, [number, number, number]> =
    AutoMovieEngineKinematics.indexPoseJoints(target.pose);
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
      if (
        x[0] !== 0 ||
        x[1] !== 0 ||
        x[2] !== 0 ||
        v[0] !== 0 ||
        v[1] !== 0 ||
        v[2] !== 0
      )
        hinged.set(bone, { x, v });
      continue;
    }
    const vs: IAutoMovieVector3 = source.velocity.spins.get(bone) ?? zero;
    const vt: IAutoMovieVector3 = target.velocity.spins.get(bone) ?? zero;
    const same: boolean = s[0] === t[0] && s[1] === t[1] && s[2] === t[2];
    const x: IAutoMovieVector3 = same
      ? zero
      : samplePoseVelocityImplementation.rotationVector(
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
  const rotation0: IAutoMovieVector3 = samplePoseVelocityImplementation.rotationVector(
    Quaternion.multiply(sr, Quaternion.inverse(tr)),
  );
  const spin0: IAutoMovieVector3 = {
    x: source.velocity.angular.x - target.velocity.angular.x,
    y: source.velocity.angular.y - target.velocity.angular.y,
    z: source.velocity.angular.z - target.velocity.angular.z,
  };
  return (elapsed: number, pose: IAutoMoviePose): IAutoMoviePose => {
    const now: Map<AutoMovieHumanoidBone, [number, number, number]> =
      AutoMovieEngineKinematics.indexPoseJoints(pose);
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
        joints.push({
          bone,
          flexion: hingedAngle(
            base[0],
            h.x[0],
            h.v[0],
            duration,
            elapsed,
            through,
          ),
          abduction: hingedAngle(
            base[1],
            h.x[1],
            h.v[1],
            duration,
            elapsed,
            through,
          ),
          twist: hingedAngle(
            base[2],
            h.x[2],
            h.v[2],
            duration,
            elapsed,
            through,
          ),
        });
        continue;
      }
      const o: { x: IAutoMovieVector3; v: IAutoMovieVector3 } | undefined =
        offsets.get(bone);
      const offset: IAutoMovieQuaternion | null =
        o === undefined ? null : decayed(o.x, o.v, duration, elapsed, through);
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
    for (const k of AXES)
      translation[k] += inertializeOffset(
        st[k] - tt[k],
        source.velocity.linear[k] - target.velocity.linear[k],
        duration,
        elapsed,
        through,
      ).value;
    const offset: IAutoMovieQuaternion =
      decayed(rotation0, spin0, duration, elapsed, through) ??
      Quaternion.identity();
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

/*
 * World/rotation-vector components in their existing decay evaluation order.
 */
const AXES: readonly ["x", "y", "z"] = ["x", "y", "z"];

/*
 * Apply the same scalar hinge offset without creating a per-joint angle
 * closure.
 */
function hingedAngle(
  base: number,
  x: number,
  v: number,
  duration: number,
  elapsed: number,
  through: boolean,
): number {
  return base + inertializeOffset(x, v, duration, elapsed, through).value;
}

/*
 * The same decayed rotation-vector exponential, including the original
 * near-zero branch.
 */
function decayed(
  x: IAutoMovieVector3,
  v: IAutoMovieVector3,
  duration: number,
  elapsed: number,
  through: boolean,
): IAutoMovieQuaternion | null {
  const turn: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const k of AXES)
    turn[k] = inertializeOffset(x[k], v[k], duration, elapsed, through).value;
  const angle: number = Math.hypot(turn.x, turn.y, turn.z);
  return angle < 1e-12
    ? null
    : Quaternion.fromAxisAngle(
        { x: turn.x / angle, y: turn.y / angle, z: turn.z / angle },
        (angle * 180) / Math.PI,
      );
}
