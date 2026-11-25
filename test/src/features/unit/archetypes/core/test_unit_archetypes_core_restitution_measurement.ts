import { AutoMovieArchetypeRestitution } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieArchetypeRestitution.measurement` finds the measured row of a
 * material against another at one impact speed, or null when none was measured.
 *
 * Scenarios:
 *
 * 1. Wood against wood at 1 m/s is Jankowski's pinewood row, range 0.5334 to
 *    0.5797.
 * 2. The same pair at 2 m/s was not measured, so it is null.
 */
export function test_unit_archetypes_core_restitution_measurement(): void {
  const row = AutoMovieArchetypeRestitution.measurement("wood", "wood", 1);
  TestValidator.equals("the row's range", row?.range, [0.5334, 0.5797]);
  TestValidator.equals(
    "an unmeasured speed",
    AutoMovieArchetypeRestitution.measurement("wood", "wood", 2),
    null,
  );
}
