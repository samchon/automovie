import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { BendClinicalNodes } from "./BendClinicalNodes";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { normalizeJointAxes } from "./normalizeJointAxes";

/** Current axes and limits already selected by the ordinary arm scorer. */
interface IAutoMoviePreparedBendClinical {
  upperBone: AutoMovieHumanoidBone;
  lowerBone: AutoMovieHumanoidBone;
  handBone: AutoMovieHumanoidBone;
  upperBasis: IAutoMovieJointAxes;
  lowerBasis: IAutoMovieJointAxes;
  lowerAxes: IAutoMovieJointAxes;
  handAxes: IAutoMovieJointAxes;
  upperRange: IAutoMovieJointConstraint | null;
  lowerRange: IAutoMovieJointConstraint | null;
  handRange: IAutoMovieJointConstraint | null;
}

/** Flat words with explicit absence and record boundaries. */
type AutoMovieClinicalWords = (number | string | null | undefined)[];

/** Clinical directions and channels in their comparison order. */
const AXES: readonly string[] = ["flexion", "abduction", "twist"];

/**
 * Capture the current clinical words consumed by an ordinary elbow sweep.
 *
 * @param input Already selected bone names, axes and clinical ranges.
 * @returns Exact scalar words in their native order, or undefined if the known
 *   records cannot prove an own-data read.
 */
export function readPreparedBendClinical(
  input: IAutoMoviePreparedBendClinical,
): readonly (number | string | null | undefined)[] | undefined {
  const { upperBone, lowerBone, handBone } = input;
  const words: AutoMovieClinicalWords = [upperBone, lowerBone, handBone];
  if (
    !normalizeJointAxes.owns(input.upperBasis) ||
    !normalizeJointAxes.owns(input.lowerBasis) ||
    !PoseResolutionSnapshot.ownsAxes(input.lowerAxes) ||
    !PoseResolutionSnapshot.ownsAxes(input.handAxes) ||
    !axes(input.upperBasis, words) ||
    !axes(input.lowerBasis, words) ||
    !axes(input.lowerAxes, words) ||
    !axes(input.handAxes, words) ||
    !range(input.upperRange, words) ||
    !range(input.lowerRange, words) ||
    !range(input.handRange, words)
  )
    return undefined;

  for (const bone of [upperBone, lowerBone, handBone]) {
    const defaults: PropertyDescriptor | null = field(
      HUMANOID_JOINT_AXES,
      bone,
    );
    const rest: PropertyDescriptor | null = field(HUMANOID_REST_FRAME, bone);
    if (defaults === null || rest === null || !frame(rest.value, words))
      return undefined;

    const basis: unknown = defaults.value;
    words.push(basis === undefined ? undefined : "default axes");
    if (
      basis !== undefined &&
      (!BendClinicalNodes.owns(basis) ||
        !AXES.every((axis: string): boolean =>
          BendClinicalNodes.owns(field(basis, axis)?.value),
        ) ||
        !axes(basis, words))
    )
      return undefined;
  }
  return words;
}

/** Read an own data field or prove its absence on an ordinary known record. */
function field(owner: object, key: string): PropertyDescriptor | null {
  if (Object.getPrototypeOf(owner) !== Object.prototype) return null;
  const own: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
    owner,
    key,
  );
  if (own !== undefined) return "value" in own ? own : null;
  return Object.getOwnPropertyDescriptor(Object.prototype, key) === undefined
    ? { value: undefined }
    : null;
}

/** Append finite components of an already owned record in the given order. */
function numbers(
  value: unknown,
  keys: readonly string[],
  words: AutoMovieClinicalWords,
): boolean {
  if (typeof value !== "object" || value === null) return false;
  for (const key of keys) {
    const scalar: unknown = field(value, key)?.value;
    if (typeof scalar !== "number") return false;
    words.push(scalar);
  }
  return true;
}

/** Read the three owned direction vectors and optional basis conventions. */
function axes(value: object, words: AutoMovieClinicalWords): boolean {
  for (const axis of AXES)
    if (!numbers(field(value, axis)?.value, ["x", "y", "z"], words))
      return false;
  for (const key of ["twistPlacement", "rotationOrder"]) {
    const record: PropertyDescriptor | null = field(value, key);
    if (
      record === null ||
      (record.value !== undefined && typeof record.value !== "string")
    )
      return false;
    words.push(record.value);
  }
  return true;
}

/** Read current constraints and their optional swing/twist gate. */
function range(value: unknown, words: AutoMovieClinicalWords): boolean {
  if (value === null) {
    words.push(null);
    return true;
  }
  if (!BendClinicalNodes.owns(value)) return false;
  words.push("constraint");
  for (const key of AXES)
    if (!interval(field(value, key)?.value, words)) return false;
  const swing: PropertyDescriptor | null = field(value, "swingDeg");
  const turn: PropertyDescriptor | null = field(value, "swingTwist");
  if (swing === null || turn === null || !optional(swing.value, words))
    return false;
  if (turn.value === undefined) {
    words.push(undefined);
    return true;
  }
  const gate: unknown = turn.value;
  if (
    !BendClinicalNodes.owns(gate) ||
    !interval(field(gate, "twist")?.value, words)
  )
    return false;
  const reach: PropertyDescriptor | null = field(gate, "reach");
  return reach !== null && optional(reach.value, words);
}

/** Read an optional finite bound without coercion. */
function optional(value: unknown, words: AutoMovieClinicalWords): boolean {
  if (
    value !== undefined &&
    (typeof value !== "number")
  )
    return false;
  words.push(value);
  return true;
}

/** Read a nullable interval of the current chart. */
function interval(value: unknown, words: AutoMovieClinicalWords): boolean {
  if (value === null) {
    words.push(null);
    return true;
  }
  return BendClinicalNodes.owns(value) && numbers(value, ["min", "max"], words);
}

/** Read each current clinical affine map, preserving absent axes. */
function frame(value: unknown, words: AutoMovieClinicalWords): boolean {
  if (value === undefined) {
    words.push(undefined);
    return true;
  }
  if (!BendClinicalNodes.owns(value)) return false;
  words.push("rest frame");
  for (const axis of AXES) {
    const descriptor: PropertyDescriptor | null = field(value, axis);
    if (descriptor === null) return false;
    if (descriptor.value === undefined) words.push(undefined);
    else if (
      !BendClinicalNodes.owns(descriptor.value) ||
      !numbers(descriptor.value, ["sign", "neutral"], words)
    )
      return false;
  }
  return true;
}
