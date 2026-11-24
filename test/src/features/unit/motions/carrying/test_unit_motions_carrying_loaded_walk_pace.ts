import { loadedWalkPace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one quotient and product, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `loadedWalkPace` is the share of the unloaded walking speed kept under a load
 * of a share of the body's mass (Middleton et al. 2022, Table 2): unchanged to
 * a fifth, 4.6 / 4.75 at two fifths, linear between and held beyond.
 *
 * Scenarios:
 *
 * 1. No load and a fifth keep the whole speed.
 * 2. Two fifths and more keep 4.6 / 4.75.
 * 3. Three tenths, half way, keep the mean of the two.
 */
export function test_unit_motions_carrying_loaded_walk_pace(): void {
  const loaded: number = 4.6 / 4.75;
  TestValidator.predicate(
    "light loads",
    nclose(loadedWalkPace(0), 1, ROUNDING) &&
      nclose(loadedWalkPace(0.2), 1, ROUNDING),
  );
  TestValidator.predicate(
    "two fifths and more",
    nclose(loadedWalkPace(0.4), loaded, ROUNDING) &&
      nclose(loadedWalkPace(0.9), loaded, ROUNDING),
  );
  TestValidator.predicate(
    "half way",
    nclose(loadedWalkPace(0.3), (1 + loaded) / 2, ROUNDING),
  );
}
