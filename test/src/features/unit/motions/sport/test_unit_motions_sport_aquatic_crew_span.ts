import { AquaticCrew } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `AquaticCrew.span` is a crew motion's progress over a window: the minimum-jerk
 * share `10 u³ - 15 u⁴ + 6 u⁵` of the clamped linear progress `u`.
 *
 * A window from 1 s to 3 s.
 *
 * Scenarios:
 *
 * 1. Before it, none; at its middle, a half; after it, all.
 * 2. A quarter in, `u = 1/4` gives `10/64 - 15/256 + 6/1024` = 0.103515625.
 */
export function test_unit_motions_sport_aquatic_crew_span(): void {
  TestValidator.predicate(
    "the minimum-jerk progress",
    AquaticCrew.span(0, 1, 3) === 0 &&
      nclose(AquaticCrew.span(2, 1, 3), 0.5, 1e-12) &&
      AquaticCrew.span(4, 1, 3) === 1 &&
      nclose(AquaticCrew.span(1.5, 1, 3), 0.103515625, 1e-12),
  );
}
