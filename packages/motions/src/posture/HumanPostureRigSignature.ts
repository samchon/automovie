import {
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieRestFrame,
} from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Exact scalar signature of the rig inputs a cold free-leg posture reads.
 * Profile/measure data is absent because this restricted path has no arm,
 * digit, contact or external-shape solve. Canonical mapping/ROM tables and
 * both live skeleton and supplied topology records are included.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the restricted consumer, all included scalar prerequisites and unused profile/measure boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Serializes explicitly projected rig data and clinical tables in their actual order; tagged numerical strings distinguish signed zero, nonfinite values and malformed primitive replacements without relying on mutable object identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One typed projection owns token invalidation; the normal resolver remains responsible for admission, clamping and all numerical work.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Contains no pose answer, tolerance, quantization or body-name exception; every skeleton/topology/ROM/axes/frame scalar read by the restricted solve enters the signature, and an exception declines reuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes linear time and temporary string storage in B live/topology bone records plus canonical table entries, replacing no actual cold numerical calculation; caller uses it only for explicit prepared transport.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Matching ordered scalar strings establish unchanged rig prerequisites for the token's same body; topology replacement and private FK snapshot replacement are checked separately by its owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one string or null and retains no body, rig, map or result; the explicit preparation owns its source signature until that preparation and carried postures are released.
 */
export function HumanPostureRigSignature(body: IHumanBody): string | null {
  try {
    return JSON.stringify([
      body.skeleton.id,
      body.skeleton.bones.map(bone),
      [...body.topology.childrenByParent].map(
        ([parent, children]: readonly [string, readonly IAutoMovieBone[]]): readonly [string, readonly string[]] => [
          parent,
          children.map(bone),
        ],
      ),
      [...body.topology.reachableBones],
      axes(DEFAULT_JOINT_AXES),
      Object.entries(DEFAULT_HUMANOID_ROM).map(
        ([name, value]: readonly [string, IAutoMovieJointConstraint | undefined]): readonly [string, string] => [name, constraint(value)],
      ),
      Object.entries(HUMANOID_JOINT_AXES).map(
        ([name, value]: readonly [string, IAutoMovieJointAxes | undefined]): readonly [string, string] => [name, axes(value)],
      ),
      Object.entries(HUMANOID_REST_FRAME).map(
        ([name, value]: readonly [string, IAutoMovieRestFrame | undefined]): readonly [string, string] => [name, frame(value)],
      ),
    ]);
  } catch {
    return null;
  }
}

/** Preserve exact primitive type and signed-zero distinctions at numeric slots. */
function scalar(value: number | null | undefined): string {
  return `${typeof value}:${Object.is(value, -0) ? "-0" : String(value)}`;
}

/** World or local vector components in their original order. */
function vector(value: IAutoMovieVector3): string {
  return [scalar(value.x), scalar(value.y), scalar(value.z)].join("|");
}

/** Quaternion components in their original order, without normalization. */
function quaternion(value: IAutoMovieQuaternion): string {
  return `${vector(value)}|${scalar(value.w)}`;
}

/** Every axis interval and combined-domain parameter consumed by ROM. */
function constraint(value: IAutoMovieJointConstraint | null | undefined): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  return JSON.stringify([
    ...([value.flexion, value.abduction, value.twist] as const).map(
      (range: IAutoMovieAngleRange | null | undefined): string => range === null
        ? "null"
        : range === undefined
          ? "undefined"
          : `${scalar(range.min)}|${scalar(range.max)}`,
    ),
    scalar(value.swingDeg),
    value.swingTwist === null
      ? "null"
      : value.swingTwist === undefined
        ? "undefined"
        : [
            scalar(value.swingTwist.twist.min),
            scalar(value.swingTwist.twist.max),
            scalar(value.swingTwist.reach),
          ],
  ]);
}

/** Actual basis components and intrinsic placement, before normalization. */
function axes(value: IAutoMovieJointAxes | undefined): string {
  return value === undefined
    ? "undefined"
    : JSON.stringify([
        vector(value.flexion),
        vector(value.abduction),
        vector(value.twist),
        value.twistPlacement,
      ]);
}

/** Clinical affine signs and neutral degrees, including absent axes. */
function frame(value: IAutoMovieRestFrame | undefined): string {
  return value === undefined
    ? "undefined"
    : JSON.stringify(([value.flexion, value.abduction, value.twist] as const).map(
        (axis: IAutoMovieRestFrame["flexion"]): string => axis === undefined
          ? "undefined"
          : `${scalar(axis.sign)}|${scalar(axis.neutral)}`,
      ));
}

/** Live bone metadata, including ignored scale so any authored rig edit invalidates. */
function bone(value: IAutoMovieBone): string {
  return JSON.stringify([
    value.bone,
    value.parent,
    vector(value.rest.translation),
    quaternion(value.rest.rotation),
    vector(value.rest.scale),
    constraint(value.constraint),
    axes(value.axes),
  ]);
}
