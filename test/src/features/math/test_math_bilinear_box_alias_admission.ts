import type { IAutoMovieJointConstraint } from "@automovie/interface";

import { jointRotationOracle as O } from "../internal/jointRotationOracle";

type Angles = Parameters<typeof O.compose>[0];

interface ICase {
  readonly constraint: IAutoMovieJointConstraint;
  readonly target: Angles;
  readonly expected: Angles;
}

/**
 * The bounded wrist projector preserves physical whole-turn aliases at the
 * compact box boundary and in the ordinary half-turn case.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the projected rotations and bounded degree fixtures.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises public joint projection and verifies actual recomposed world rotations for both quaternion signs.
 * @evidence contracts/development/testing.md#independent-expectations For two orthogonal factors the absolute target dot is the product of the absolute half-angle cosines of the two coordinate differences. The nearest in-range angle maximizes each factor independently in these fixtures.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks a wrist box, displaced whole turns, the zero-width boundary and compact versus half-turn widths.
 * @evidence contracts/development/testing.md#execution-ownership Uses one in-memory public projector per case and the shared independent rotation oracle.
 */
export function test_math_bilinear_box_alias_admission(): void {
  const cases: readonly ICase[] = [
    {
      constraint: {
        flexion: { min: -80, max: 70 },
        abduction: { min: -30, max: 20 },
        twist: null,
      },
      target: [82, -5, 0],
      expected: [70, -5, 0],
    },
    {
      constraint: {
        flexion: { min: 280, max: 430 },
        abduction: { min: -750, max: -700 },
        twist: null,
      },
      target: [450, -720, 0],
      expected: [430, -720, 0],
    },
    {
      constraint: {
        flexion: { min: -0, max: 0 },
        abduction: { min: 0, max: 179 },
        twist: null,
      },
      target: [0, 180, 0],
      expected: [0, 179, 0],
    },
    {
      constraint: {
        flexion: { min: 10, max: 189 },
        abduction: { min: -40, max: 30 },
        twist: null,
      },
      target: [195, 15, 0],
      expected: [189, 15, 0],
    },
    {
      constraint: {
        flexion: { min: 10, max: 190 },
        abduction: { min: -40, max: 30 },
        twist: null,
      },
      target: [195, 15, 0],
      expected: [190, 15, 0],
    },
  ];
  const checks: O.IChecks = O.of();
  cases.forEach((entry: ICase, index: number): void => {
    const rig: O.IRig = O.rig(entry.constraint);
    checks.run(
      "bounded wrist box " + index,
      rig,
      O.compose(entry.target, rig),
      O.compose(entry.expected, rig),
    );
  });
  checks.assert();
}
