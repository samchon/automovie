import { TestValidator } from "@nestia/e2e";

import { sweepTransitionDeviation } from "../internal/sweepTransitionDeviation";

/**
 * At the high tier, a cylinder changing column count through transition
 * bands stays within 0.3 percent of its radius and 2.5 degrees of its
 * radial normal.
 *
 * Scenarios:
 *
 * 1. The straight tube going from 16 to 32 columns and from 32 to 24,
 *    subdivided twice, measured between its open ends.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples and subdivides the tube at the high tier and measures its limit surface; a band whose poles dent or tilt the surface beyond the bound fails.
 * @evidence contracts/testing.md#independent-expectations The cylinder's radius and radial normal are analytic; the bound is the measured accuracy of a valence-three reduction at 16 coarse columns, stated as the pattern's cost.
 * @evidence contracts/testing.md#distinguishing-cases The high tier, where bands carry two rows; the other tiers, topology, mirroring, mapping and refusals are owned by the transition test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_transition_high` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_transition_high(): void {
  const [radial, normal] = sweepTransitionDeviation("high");
  TestValidator.equals(
    "a cylinder changing count at the high tier stays within the stated bounds",
    [radial <= 0.003, normal <= 2.5],
    [true, true],
  );
}
