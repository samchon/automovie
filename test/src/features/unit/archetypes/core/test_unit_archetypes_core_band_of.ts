import { AutoMovieArchetypeBand } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieArchetypeBand.of` records a dimension's ends with their unit and
 * source, `provisional` only when it is true; `metres` is the same in metres.
 *
 * Scenarios:
 *
 * 1. Of("kg", 1, 2, "s") has no provisional field; with true it has one.
 * 2. Metres(0.5, 0.5, "s") is a fixed metre band.
 * 3. Ends out of order, 2 to 1, refuse.
 */
export function test_unit_archetypes_core_band_of(): void {
  TestValidator.equals(
    "a sourced band",
    AutoMovieArchetypeBand.of("kg", 1, 2, "s"),
    { minimum: 1, maximum: 2, unit: "kg", source: "s" },
  );
  TestValidator.equals(
    "a provisional band",
    AutoMovieArchetypeBand.of("kg", 1, 2, "s", true),
    { minimum: 1, maximum: 2, unit: "kg", source: "s", provisional: true },
  );
  TestValidator.equals(
    "a fixed metre band",
    AutoMovieArchetypeBand.metres(0.5, 0.5, "s"),
    { minimum: 0.5, maximum: 0.5, unit: "m", source: "s" },
  );
  TestValidator.error("ends out of order", (): unknown =>
    AutoMovieArchetypeBand.of("m", 2, 1, "s"),
  );
}
