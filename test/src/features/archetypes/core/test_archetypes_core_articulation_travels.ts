import { AutoMovieArchetypeArticulation } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieArchetypeArticulation.travels` turns a state record into the map of
 * absolute travels, leaving out an entry that is not given.
 *
 * Scenarios:
 *
 * 1. A record of two travels becomes a map of the two, in the record's order.
 * 2. An entry that is undefined is left out.
 */
export function test_archetypes_core_articulation_travels(): void {
  TestValidator.equals(
    "two travels",
    [
      ...AutoMovieArchetypeArticulation.travels<"door" | "lid">({
        door: 30,
        lid: -5,
      }),
    ],
    [
      ["door", 30],
      ["lid", -5],
    ],
  );
  TestValidator.equals(
    "an undefined entry",
    [
      ...AutoMovieArchetypeArticulation.travels<"door" | "lid">({
        door: undefined,
        lid: 0,
      }),
    ],
    [["lid", 0]],
  );
}
