import {
  admitQuadrupedPhase
} from "../../../../../packages/archetypes/src/animals/quadruped/admitQuadrupedPhase";
import { TestValidator } from "@nestia/e2e";

/**
 * One cell advances the gait clock by seconds over stride period.
 *
 * Scenarios:
 *
 * 1. One quarter-cycle may cross an integer, a whole cycle advances, and the last
 *    phase may equal the cell capacity.
 * 2. A cell over one cycle refuses even when it crosses only one integer. Negative
 *    time, overflow, no representable advance and over-capacity phase also
 *    refuse before stride enumeration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the legal phase advances, exact capacity and five invalid cell or clock cases.
 * @evidence contracts/development/testing.md#behavioral-verification Advances the actual phase reader across an integer and to exact capacity, then submits longer, negative, overflowing, unrepresentable and over-capacity advances.
 * @evidence contracts/development/testing.md#independent-expectations Half a second at a two-second period adds 1/4 to 7/8. A single one-second cycle from phase 2 reaches 3. One quarter of an ULP at phase 1 cannot change its binary64 representation.
 */
export function test_archetypes_internal_admit_quadruped_phase(): void {
  TestValidator.equals(
    "quarter-cycle advances across a boundary",
    admitQuadrupedPhase("test", 7 / 8, 1 / 2, 2, 3),
    9 / 8,
  );
  TestValidator.equals(
    "whole cell at capacity",
    admitQuadrupedPhase("test", 2, 1, 1, 3),
    3,
  );
  TestValidator.error("one decision is permitted per cell", (): unknown =>
    admitQuadrupedPhase("test", 0, 5 / 4, 1, 3),
  );
  TestValidator.error("negative cell width", (): unknown =>
    admitQuadrupedPhase("test", 1, -1 / 4, 1, 3),
  );
  TestValidator.error("an overflowing quotient", (): unknown =>
    admitQuadrupedPhase("test", 0, 1, Number.MIN_VALUE, 3),
  );
  TestValidator.error("the phase cannot represent the advance", (): unknown =>
    admitQuadrupedPhase("test", 1, Number.EPSILON / 4, 1, 3),
  );
  TestValidator.error("beyond the final decision", (): unknown =>
    admitQuadrupedPhase("test", 3, 1 / 4, 1, 3),
  );
}
