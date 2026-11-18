import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanCarriedCouplingLoad } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Two hand supports divide vertical load according to the centre’s lever arms.
 *
 * Scenarios:
 * 1. Move the centre across a one-metre baseline and beyond its right-hand endpoint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two hand supports divide vertical load according to the centre’s lever arms.
 * @evidence contracts/development/testing.md#independent-expectations Moment balance about the left hand gives the right reaction equal to the centre’s distance along the unit baseline.
 * @evidence contracts/development/testing.md#distinguishing-cases At and beyond the end the opposite hand cannot carry a negative reaction.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_hand_bearing_reactions(): void {
  const supports: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ];
  for (const [x, right] of [
    [0, 0],
    [0.25, 0.25],
    [1, 1],
    [1.25, 1],
  ] as const) {
    const shares: number[] = HumanCarriedCouplingLoad.shares(supports, {
      x,
      y: 0,
      z: 0,
    });
    TestValidator.predicate(
      "nonnegative balanced reactions",
      nclose(shares[0]!, 1 - right) && nclose(shares[1]!, right),
    );
  }
}
