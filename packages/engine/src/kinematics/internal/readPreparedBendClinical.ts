import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import type { AutoMovieEngineKinematicsTypes } from "../AutoMovieEngineKinematicsTypes";

import { AutoMovieEngineHumanoidRestFrame } from "../../rom/AutoMovieEngineHumanoidRestFrame";
import { AutoMovieEngineHumanoidJointAxes } from "../AutoMovieEngineHumanoidJointAxes";

/*
 * Capture the current clinical words consumed by an ordinary elbow sweep.
 * Parameter input: Already selected bone names, axes and clinical ranges.
 * Returns: Exact scalar words in their native order.
 */
export function readPreparedBendClinical(
  input: AutoMovieEngineKinematicsTypes.IReadPreparedBendClinicalInput,
): readonly (number | string | null | undefined)[] {
  const { upperBone, lowerBone, handBone } = input;
  const words: AutoMovieClinicalWords = [upperBone, lowerBone, handBone];
  for (const basis of [
    input.upperBasis,
    input.lowerBasis,
    input.lowerAxes,
    input.handAxes,
  ])
    axes(basis, words);
  for (const constraint of [
    input.upperRange,
    input.lowerRange,
    input.handRange,
  ])
    range(constraint, words);
  for (const bone of [upperBone, lowerBone, handBone]) {
    frame(AutoMovieEngineHumanoidRestFrame[bone], words);
    const basis: IAutoMovieJointAxes | undefined = AutoMovieEngineHumanoidJointAxes[bone];
    words.push(basis === undefined ? undefined : "default axes");
    if (basis !== undefined) axes(basis, words);
  }
  return words;
}

/*
 * Clinical directions and channels in their comparison order.
 */
const AXES = ["flexion", "abduction", "twist"] as const;



/*
 * Flat words with explicit absence and record boundaries.
 */
type AutoMovieClinicalWords = (number | string | null | undefined)[];

/*
 * Append the three direction vectors and optional basis conventions.
 */
function axes(value: IAutoMovieJointAxes, words: AutoMovieClinicalWords): void {
  for (const axis of AXES)
    words.push(value[axis].x, value[axis].y, value[axis].z);
  words.push(value.twistPlacement, value.rotationOrder);
}

/*
 * Append a current constraint and its optional swing/twist gate.
 */
function range(
  value: IAutoMovieJointConstraint | null,
  words: AutoMovieClinicalWords,
): void {
  if (value === null) {
    words.push(null);
    return;
  }
  words.push("constraint");
  for (const key of AXES) interval(value[key], words);
  words.push(value.swingDeg);
  const gate: IAutoMovieJointConstraint["swingTwist"] = value.swingTwist;
  if (gate === undefined || gate === null) {
    words.push(undefined);
    return;
  }
  interval(gate.twist, words);
  words.push(gate.reach);
}

/*
 * Append a nullable interval of the current chart.
 */
function interval(
  value: IAutoMovieAngleRange | null,
  words: AutoMovieClinicalWords,
): void {
  if (value === null) words.push(null);
  else words.push(value.min, value.max);
}

/*
 * Append each current clinical affine map, preserving absent axes.
 */
function frame(
  value: IAutoMovieRestFrame | undefined,
  words: AutoMovieClinicalWords,
): void {
  if (value === undefined) {
    words.push(undefined);
    return;
  }
  words.push("rest frame");
  for (const axis of AXES) {
    const map: IAutoMovieAxisFrame | undefined = value[axis];
    if (map === undefined) words.push(undefined);
    else words.push(map.sign, map.neutral);
  }
}
