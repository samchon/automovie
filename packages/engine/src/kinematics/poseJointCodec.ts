import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMoviePoseRig,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { jointToQuaternion } from "./jointToQuaternion";
import { skeletonJointAxes } from "./internal/skeletonJointAxes";

/**
 * The two maps between a joint's clinical angles and its bone-local rotation on
 * one rig, for work that must treat a pose's joints as rotations.
 *
 * A joint's `[flexion, abduction, twist]` is an Euler chart of a rotation: at
 * the chart's gimbal (a hanging arm on a T-pose rig, where the shoulder's
 * abduction is 90 degrees from rest) two of the angles turn about one axis, so
 * nearly equal rotations have far apart triples, and a difference or blend
 * taken per angle swings the bone through poses neither side holds. Differences
 * and blends are therefore taken on the rotation, and the result is lowered to
 * angles once.
 *
 * `rotation` is {@link jointToQuaternion} with the rig's axes (a bone's own
 * declaration before the host table, {@link skeletonJointAxes}) and rest frame.
 * `angles` is {@link decomposeJointRotation} with the same two and the bone's
 * effective range of motion ({@link getConstraint}), so of the equivalent
 * triples it returns the one the range admits best, as the limb fits do.
 * Without a rig both use the default basis with rest-relative angles and the
 * principal chart.
 *
 * That holds for a joint free about all three axes. A hinge or a two-axis joint
 * spans a lower-dimensional set of rotations, which a composed rotation leaves,
 * and its angles have no gimbal inside their range; `ball` tells the two apart
 * so a caller keeps such a joint on its own angles.
 *
 * @param rig The rig the angles are read through; the default basis when
 *   omitted.
 * @returns The forward and inverse maps.
 */
export function poseJointCodec(
  rig?: IAutoMoviePoseRig,
): IAutoMoviePoseJointCodec.ICodec {
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    rig === undefined ? {} : skeletonJointAxes(rig.skeleton, rig.jointAxes);
  const declared: Map<AutoMovieHumanoidBone, IAutoMovieJointConstraint | null> =
    new Map();
  for (const bone of rig?.skeleton.bones ?? [])
    declared.set(bone.bone, bone.constraint ?? null);
  return {
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ): IAutoMovieQuaternion =>
      jointToQuaternion(
        { flexion: angles[0], abduction: angles[1], twist: angles[2] },
        axes[bone],
        rig?.restFrames?.[bone],
      ),
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): [number, number, number] => {
      const a: IAutoMovieResolvedJointAngles = decomposeJointRotation(
        rotation,
        axes[bone],
        rig?.restFrames?.[bone],
        rig === undefined
          ? undefined
          : {
              bone,
              constraint: getConstraint(bone, declared.get(bone) ?? null),
            },
      );
      return [a.flexion, a.abduction, a.twist];
    },
    ball: (bone: AutoMovieHumanoidBone): boolean => {
      if (rig === undefined) return true;
      const c: IAutoMovieJointConstraint | null = getConstraint(
        bone,
        declared.get(bone) ?? null,
      );
      return (
        c === null ||
        (mobile(c.flexion) && mobile(c.abduction) && mobile(c.twist))
      );
    },
  };
}

/** Companion types of {@link poseJointCodec}. */
export namespace poseJointCodec {
  /**
   * Own one actual codec across related velocity reads and offset capture. Keep
   * the rig unchanged through those construction stages. The codec is made at
   * preparation. No pose, quaternion or angle result is cached.
   *
   * @param rig The same rig both sampled states and the offset use.
   * @returns A one-codec getter.
   */
  export function prepare(
    rig?: IAutoMoviePoseRig,
  ): () => IAutoMoviePoseJointCodec.ICodec {
    const codec: IAutoMoviePoseJointCodec.ICodec = poseJointCodec(rig);
    return (): IAutoMoviePoseJointCodec.ICodec => codec;
  }

  /**
   * Fresh clinical tuples indexed in source order, LAST duplicate wins. Null
   * angles keep their clinical-zero reading. The caller owns the map and
   * tuples; nothing is retained. O(J) output and the existing entry array
   * preserve the original map admission, with no per-call mapper closure.
   *
   * @param pose The actual pose whose joint channels are read.
   * @returns Fresh indexed clinical-degree tuples.
   */
  export function index(
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, [number, number, number]> {
    return new Map(pose.joints.map(entry));
  }
}

/**
 * Whether an admitted axis interval has nonzero freedom, preserving null
 * immobility.
 */
function mobile(range: IAutoMovieAngleRange | null): boolean {
  return range !== null && range.max > range.min;
}

/**
 * One fresh clinical tuple and its bone, preserving the pose's source read
 * order.
 */
function entry(
  joint: IAutoMovieJointPose,
): [AutoMovieHumanoidBone, [number, number, number]] {
  return [
    joint.bone,
    [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
  ];
}
