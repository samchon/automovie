import { AutoMovieArchetypeTrack } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
export function test_unit_archetypes_core_track_agm(): void {
  const agm = AutoMovieArchetypeTrack.agm;
  TestValidator.predicate("equal numbers", nclose(agm(1, 1), 1, 1e-15));
  TestValidator.predicate(
    "Gauss's constant",
    nclose(agm(1, Math.SQRT2), 1.1981402347355922, 1e-14),
  );
  TestValidator.predicate(
    "one and two",
    nclose(agm(1, 2), 1.4567910310469068, 1e-14),
  );
  TestValidator.predicate("symmetric", nclose(agm(2, 1), agm(1, 2), 1e-15));
  TestValidator.predicate(
    "homogeneous",
    nclose(agm(4, 8), 4 * agm(1, 2), 1e-13),
  );
  TestValidator.error("a zero argument", (): unknown => agm(0, 1));
  TestValidator.error("a negative argument", (): unknown => agm(-1, 1));
}
