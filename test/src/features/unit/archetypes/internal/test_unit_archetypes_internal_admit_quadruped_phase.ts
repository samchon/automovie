import { admitQuadrupedPhase } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * One cell advances the gait clock by seconds over stride period.
 *
 * Scenarios:
 *
 * 1. One quarter-cycle may cross an integer, a whole cycle advances, and the
 *    last phase may equal the cell capacity.
 * 2. A cell over one cycle refuses even when it crosses only one integer.
 *    Negative time, overflow, no representable advance and over-capacity phase
 *    also refuse before stride enumeration.
 */
export function test_unit_archetypes_internal_admit_quadruped_phase(): void {
  TestValidator.equals("quarter-cycle advances across a boundary", admitQuadrupedPhase("test", 7 / 8, 1 / 2, 2, 3), 9 / 8);
  TestValidator.equals("whole cell at capacity", admitQuadrupedPhase("test", 2, 1, 1, 3), 3);
  TestValidator.error("one decision is permitted per cell", (): unknown => admitQuadrupedPhase("test", 0, 5 / 4, 1, 3));
  TestValidator.error("negative cell width", (): unknown => admitQuadrupedPhase("test", 1, -1 / 4, 1, 3));
  TestValidator.error("an overflowing quotient", (): unknown => admitQuadrupedPhase("test", 0, 1, Number.MIN_VALUE, 3));
  TestValidator.error("the phase cannot represent the advance", (): unknown => admitQuadrupedPhase("test", 1, Number.EPSILON / 4, 1, 3));
  TestValidator.error("beyond the final decision", (): unknown => admitQuadrupedPhase("test", 3, 1 / 4, 1, 3));
}
