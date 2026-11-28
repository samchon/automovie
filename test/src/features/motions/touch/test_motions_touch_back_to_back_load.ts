import {
  backToBackLoad
} from "../../../../../packages/motions/src/touch/internal/backToBackLoad";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a quotient and a tangent. */
const ROUNDING: number = 1e-12;

/**
 * Check the share of body weight carried by a leaning partner.
 *
 * Scenarios:
 *
 * 1. A 70 kg fixture with 29 kg in the upper trunk gives the same load for
 *    +25 and -25 degrees.
 * 2. An 80 degree lean reaches the whole-body ceiling of one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the mass fraction, lean symmetry and upper bound.
 * @evidence contracts/development/testing.md#behavioral-verification The helper reads the fixture's segment masses at three authored leans.
 * @evidence contracts/development/testing.md#independent-expectations Sum the five trunk masses, multiply `29 / 70` by the tangent of 25 degrees and bound the share at one.
 */
export function test_motions_touch_back_to_back_load(): void {
  const body: backToBackLoad.IBody = {
    massModel: {
      mass: 70,
      segments: [
        { bone: "hips", mass: 11 },
        { bone: "spine", mass: 10 },
        { bone: "chest", mass: 8 },
        { bone: "upperChest", mass: 5 },
        { bone: "neck", mass: 1 },
        { bone: "head", mass: 5 },
      ],
    },
  };
  const expected: number = (29 / 70) * Math.tan((25 * Math.PI) / 180);
  TestValidator.predicate(
    "the lean's share",
    nclose(backToBackLoad(body, 25), expected, ROUNDING) &&
      nclose(backToBackLoad(body, -25), expected, ROUNDING),
  );
  TestValidator.equals("at most the whole", backToBackLoad(body, 80), 1);
}
