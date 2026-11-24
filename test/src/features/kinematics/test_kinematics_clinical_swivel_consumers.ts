import {
  Quaternion,
  boxExcludedSwivels,
  swingTwistRegion,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Read a flexion-first hip chart through the swivel and swing-region consumers.
 *
 * Scenarios:
 * 1. The swivel box retains a planted, independently composed orientation
 *    and excludes an interval whose flexion exceeds the range.
 * 2. The swing-region rays agree with the equivalent two swing factors
 *    expressed on the legacy distal chart's quarter-turned ray basis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the axis order, physical reference and both consuming bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates actual box exclusion and radial table output with a noncommuting clinical chart.
 * @evidence contracts/development/testing.md#independent-expectations The box reference is an explicit product of the three axis quaternions. The radial reference uses the same two physical swing rotations with axis and affine chart labels exchanged, reindexing the actual ray directions by 90 degrees.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both admitted and excluded swivels, asymmetric angle ranges, a nonidentity rest map and no twist-placement field on the explicit chart.
 * @evidence contracts/development/testing.md#execution-ownership A direct synchronous engine feature test using caller-owned input records.
 */
export function test_kinematics_clinical_swivel_consumers(): void {
  const basis: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    rotationOrder: "flexion-abduction-twist",
  };
  const narrow: IAutoMovieJointConstraint = {
    flexion: { min: 25, max: 35 },
    abduction: { min: 20, max: 36 },
    twist: { min: 15, max: 31 },
  };
  const rotation = (angle: number): IAutoMovieQuaternion =>
    Quaternion.multiply(
      Quaternion.fromAxisAngle(basis.flexion, angle),
      Quaternion.multiply(
        Quaternion.fromAxisAngle(basis.abduction, 29),
        Quaternion.fromAxisAngle(basis.twist, 24),
      ),
    );
  const excludes: ReturnType<typeof boxExcludedSwivels> = boxExcludedSwivels({
    basis,
    frame: undefined,
    constraint: narrow,
    rotation,
  });
  TestValidator.predicate(
    "the flexion-first box preserves the exact target and excludes an over-flexed interval",
    !excludes(26, 34) && excludes(53, 59),
  );

  const constraint: IAutoMovieJointConstraint = {
    flexion: { min: -43, max: 77 },
    abduction: { min: -31, max: 28 },
    twist: { min: -20, max: 65 },
  };
  const current: IAutoMovieJointRotationFrame = {
    axes: basis,
    frame: {
      flexion: { sign: -1, neutral: 8 },
      abduction: { sign: 1, neutral: -7 },
    },
  };
  const equivalent: IAutoMovieJointRotationFrame = {
    axes: {
      flexion: basis.abduction,
      abduction: basis.flexion,
      twist: basis.twist,
      twistPlacement: "distal",
    },
    frame: {
      flexion: current.frame!.abduction!,
      abduction: current.frame!.flexion!,
    },
  };
  const actual: Float64Array = swingTwistRegion.table(constraint, current);
  const expected: Float64Array = swingTwistRegion.table(
    {
      ...constraint,
      flexion: constraint.abduction,
      abduction: constraint.flexion,
    },
    equivalent,
  );
  const turn: number = actual.length / 4;
  TestValidator.predicate(
    "the explicit order exchanges swing factors while preserving the physical ray and distal twist",
    actual.every((radius: number, ray: number): boolean =>
      nclose(
        radius,
        expected[(ray + actual.length - turn) % actual.length]!,
        1e-5,
      ),
    ),
  );
}
