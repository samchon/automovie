import { AutoMovieArchetypeTrack } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Eight ulps at the larger expected mean allow both square-root rounding and the two reference decimals. */
const AGM_TOLERANCE: number = 16 * Number.EPSILON;

/** Scaling the larger pair by four scales its error bound by four as well. */
const SCALED_AGM_TOLERANCE: number = 4 * AGM_TOLERANCE;

/**
 * `AutoMovieArchetypeTrack.agm` is the arithmetic-geometric mean of two finite
 * positive numbers.
 *
 * Scenarios:
 *
 * 1. agm(1, 1) = 1.
 * 2. Gauss's value agm(1, sqrt 2) = 1.1981402347355922, the lemniscate constant
 *    over pi, and agm(1, 2) = 1.4567910310469068.
 * 3. It is symmetric and homogeneous: agm(2, 1) = agm(1, 2) and agm(4, 8) = 4
 *    agm(1, 2).
 * 4. A zero or negative argument is refused.
 */
export function test_archetypes_core_track_agm(): void {
  const agm = AutoMovieArchetypeTrack.agm;
  TestValidator.predicate("equal numbers", nclose(agm(1, 1), 1, AGM_TOLERANCE));
  TestValidator.predicate(
    "Gauss's constant",
    nclose(agm(1, Math.SQRT2), 1.1981402347355923, AGM_TOLERANCE),
  );
  TestValidator.predicate(
    "one and two",
    nclose(agm(1, 2), 1.4567910310469068, AGM_TOLERANCE),
  );
  TestValidator.predicate("symmetric", nclose(agm(2, 1), agm(1, 2), AGM_TOLERANCE));
  TestValidator.predicate(
    "homogeneous",
    nclose(agm(4, 8), 4 * agm(1, 2), SCALED_AGM_TOLERANCE),
  );
  TestValidator.error("a zero argument", (): unknown => agm(0, 1));
  TestValidator.error("a negative argument", (): unknown => agm(-1, 1));
}
