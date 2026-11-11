import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";
import { IAutoMoviePoseRig } from "./IAutoMoviePoseRig";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { jointToQuaternion } from "./jointToQuaternion";
import { skeletonJointAxes } from "./skeletonJointAxes";

/**
 * The two maps between a joint's clinical angles and its bone-local rotation
 * on one rig, for work that must treat a pose's joints as rotations.
 *
 * A joint's `[flexion, abduction, twist]` is an Euler chart of a rotation: at
 * the chart's gimbal (a hanging arm on a T-pose rig, where the shoulder's
 * abduction is 90 degrees from rest) two of the angles turn about one axis,
 * so nearly equal rotations have far apart triples, and a difference or blend
 * taken per angle swings the bone through poses neither side holds. Differences
 * and blends are therefore taken on the rotation, and the result is lowered
 * to angles once.
 *
 * `rotation` is {@link jointToQuaternion} with the rig's axes (a bone's own
 * declaration before the host table, {@link skeletonJointAxes}) and rest
 * frame. `angles` is {@link decomposeJointRotation} with the same two and the
 * bone's effective range of motion ({@link getConstraint}), so of the
 * equivalent triples it returns the one the range admits best, as the limb
 * fits do. Without a rig both use the default basis with rest-relative angles
 * and the principal chart.
 *
 * @param rig The rig the angles are read through; the default basis when omitted.
 * @returns The forward and inverse maps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why rotations are used, what each map delegates to and the no-rig reading.
 * @evidence contracts/development/implementation.md#principled-implementation The forward and inverse Euler maps of one convention, with the inverse's chart chosen by the joint's range, never an angle clamp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner pairs the two maps with one set of tables; both bodies are single delegations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is special-cased; a rotation no chart admits keeps its overshoot.
 * @evidence contracts/development/implementation.md#efficient-algorithms The axis table and the declared ranges are indexed once per codec; each map is constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The indexed tables are shared by every conversion of one codec.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the rig's tables and one range per bone, bounded by the bone count.
 */
export function poseJointCodec(rig?: IAutoMoviePoseRig): poseJointCodec.ICodec {
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    rig === undefined ? {} : skeletonJointAxes(rig.skeleton, rig.jointAxes);
  const declared: Map<AutoMovieHumanoidBone, IAutoMovieJointConstraint | null> =
    new Map(
      (rig?.skeleton.bones ?? []).map(
        (
          b: IAutoMovieBone,
        ): [AutoMovieHumanoidBone, IAutoMovieJointConstraint | null] => [
          b.bone,
          b.constraint ?? null,
        ],
      ),
    );
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
  };
}

/**
 * Companion types of {@link poseJointCodec}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each map's units and frame.
 * @evidence contracts/development/design.md#principled-representation Clinical degrees on one side, the unit articulation quaternion `resolvePose` composes after the rest rotation on the other.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two maps and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface quaternion and bone names.
 */
export namespace poseJointCodec {
  /** The two maps of one rig. */
  export interface ICodec {
    /**
     * A bone's articulation, the rotation applied after its rest rotation,
     * from its clinical `[flexion, abduction, twist]` in degrees.
     */
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ) => IAutoMovieQuaternion;

    /**
     * A bone's clinical `[flexion, abduction, twist]` in degrees from its
     * unit articulation.
     */
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ) => [number, number, number];
  }
}
