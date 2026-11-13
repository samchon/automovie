import { IAutoMovieJointAxes } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { alternateRigJointAngles } from "./alternateRigJointAngles";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "./normalizeJointAxes";

/**
 * The other reading of a joint's angles: the second Euler chart of the same
 * rotation, in the same clinical frame.
 *
 * A ball joint's rotation has two triples, and a range of motion stated as a
 * box of angles admits some rotations in one chart only. A caller that moves
 * a joint between two rotations (a motion vocabulary blending an arm between
 * two solved poses) needs both readings of an end to find a path that stays
 * inside the range, where {@link decomposeJointRotation} returns only the one
 * the range admits best. `jointToQuaternion` of the result, with the same
 * `axes` and `frame`, is the rotation of `angles`.
 *
 * No angle is wrapped by a full turn; the caller takes the alias it needs.
 * Throws on an invalid axis basis (see {@link normalizeJointAxes}) or rest
 * frame (see {@link toRigAngle}).
 *
 * @param angles One reading, degrees in the frame `frame` states.
 * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
 * @param frame Rest frame the angles are clinical in; omitted, they are rest-relative.
 * @returns The other reading, degrees in the same frame.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The angles are lowered to rest-relative ones by the frame's inverse, turned into the second chart by `alternateRigJointAngles` with the basis's own twist placement and handedness, and lifted back, so the result composes to the same rotation under the convention `jointToQuaternion` and `decomposeJointRotation` share.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One basis admission, the handedness, three inverse lifts, the chart rule and three lifts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is wrapped or clamped, no range is consulted and no bone is named; an invalid basis or frame throws.
 * @evidence contracts/development/common.md#meaningful-documentation States what the other reading is, the product need, the round trip, that aliases are the caller's, the thrown inputs and each parameter's default.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: one basis validation, one triple product and nine scalar operations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The chart rule is `alternateRigJointAngles`, the one the inverse scores, and the frame arithmetic is `toRigAngle` and `toClinicalAngle`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned angles.
 */
export const alternateJointAngles: (
  angles: IAutoMovieResolvedJointAngles,
  axes?: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
) => IAutoMovieResolvedJointAngles = (
  angles: IAutoMovieResolvedJointAngles,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): IAutoMovieResolvedJointAngles => {
  const basis: IAutoMovieJointAxes = normalizeJointAxes(
    axes,
    "alternateJointAngles axes",
  );
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  // toRigAngle and toClinicalAngle return null only for a null input.
  const other: IAutoMovieResolvedJointAngles = alternateRigJointAngles(
    {
      flexion: toRigAngle(angles.flexion, frame?.flexion)!,
      abduction: toRigAngle(angles.abduction, frame?.abduction)!,
      twist: toRigAngle(angles.twist, frame?.twist)!,
    },
    basis.twistPlacement,
    handed,
  );
  return {
    flexion: toClinicalAngle(other.flexion, frame?.flexion)!,
    abduction: toClinicalAngle(other.abduction, frame?.abduction)!,
    twist: toClinicalAngle(other.twist, frame?.twist)!,
  };
};
