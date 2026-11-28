import {
  kuzushi
} from "../../../../../packages/motions/src/grappling/internal/kuzushi";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check tip, hold and return progress for a one-second kuzushi hold.
 *
 * Scenarios:
 *
 * 1. At 0, 0.25 and 0.5 s read upright, half tipped and fully tipped. Stay
 *    fully tipped through 1.5 s.
 * 2. At 1.75 s read half returned. At 2 and 5 s read upright.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name the two transitions, held interval and clamped end.
 * @evidence contracts/development/testing.md#behavioral-verification The tip reader is evaluated at fixed film-local phase boundaries and midpoints.
 * @evidence contracts/development/testing.md#independent-expectations The half-second ramps and one-second hold fix the boundaries, and symmetric minimum jerk gives each midpoint.
 */
export function test_motions_grappling_kuzushi(): void {
  TestValidator.predicate(
    "the tip and its return",
    kuzushi.TIP === 0.5 &&
      nclose(kuzushi.tipped(1, 0), 0, 1e-12) &&
      nclose(kuzushi.tipped(1, 0.25), 0.5, 1e-12) &&
      nclose(kuzushi.tipped(1, 0.5), 1, 1e-12) &&
      nclose(kuzushi.tipped(1, 1.5), 1, 1e-12) &&
      nclose(kuzushi.tipped(1, 1.75), 0.5, 1e-12) &&
      nclose(kuzushi.tipped(1, 2), 0, 1e-12) &&
      nclose(kuzushi.tipped(1, 5), 0, 1e-12),
  );
}
