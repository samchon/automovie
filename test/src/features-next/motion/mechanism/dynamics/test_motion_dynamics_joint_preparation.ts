import {
  jointToQuaternionOnBasis,
  normalizeJointAxes,
} from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../../features/internal/qclose";

/**
 * Prepared joint factors compose changing queries in the original clinical rest frame.
 *
 * Scenarios:
 * 1. Evaluate the public operation on the same geometry across different orientations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepared joint factors compose changing queries in the original clinical rest frame.
 * @evidence contracts/development/testing.md#independent-expectations Applying the X factor before the Z factor gives their positive sine product on Y.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeated and changed frames have independently known world-space results.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_joint_preparation(): void {
  const basis = normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
    },
    "anatomical frame",
  );
  const prepare = jointToQuaternionOnBasis.prepareQueries(
    basis,
    { flexion: { sign: -1, neutral: 10 } },
    { flexion: [-30, 30], abduction: [0], twist: [20, -20] },
  );
  const query = prepare();
  for (const [flexion, twist] of [
    [40, 20],
    [-20, -20],
    [40, 20],
  ] as const) {
    const f = ((10 - flexion) * Math.PI) / 360,
      t = (twist * Math.PI) / 360;
    const expected: IAutoMovieQuaternion = {
      x: Math.sin(f) * Math.cos(t),
      y: Math.sin(f) * Math.sin(t),
      z: Math.cos(f) * Math.sin(t),
      w: Math.cos(f) * Math.cos(t),
    };
    TestValidator.predicate(
      "fixed factors with current query",
      qclose(query({ flexion, abduction: 0, twist }), expected),
    );
  }
}
