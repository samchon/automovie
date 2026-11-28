import { AutoMovieArchetypePadelCourt, AutoMovieArchetypeSquashCourt, AutoMovieArchetypeTableTennisTable } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The table tennis table and the squash and padel courts stand at their
 * governing bodies' dimensions.
 *
 * Scenarios:
 * 1. The table's surface lies 76 cm up, its net 15.25 cm above it, and its end lines 2.74 m apart.
 * 2. The squash court's front wall stands 9.75 m from the back wall, the tin's top is 48 cm up and the T is 5.44 m from the front wall.
 * 3. The padel court's net is 0.88 m high and its back walls 20 m apart.
 *
 * Each scenario is one predicate whose values must match within `nclose`'s
 * tolerance; any other dimension fails it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the table, squash and padel dimensions and the named rally features measured on each.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the built models' table or court contacts for the net, back and front boundaries, squash tin and T. The observations exercise the three separate sets of regulation geometry.
 * @evidence contracts/development/testing.md#independent-expectations The ITTF table is 2.74 m long with its playing surface at 76 cm. WSF supplies the 9.75 m squash court and 48 cm tin. FIP supplies the 20 metre padel court and 0.88 metre net.
 */
export function test_archetype_racket_courts(): void {
  const table: ReturnType<typeof AutoMovieArchetypeTableTennisTable.create> =
    AutoMovieArchetypeTableTennisTable.create();
  TestValidator.predicate(
    "the table's surface, net and end lines are the ITTF Laws'",
    nclose(table.affordance("surface").frame.translation.y, 0.76) &&
      nclose(table.affordance("net").frame.translation.y, 0.76 + 0.1525) &&
      nclose(
        table.affordance("far").frame.translation.z -
          table.affordance("end").frame.translation.z,
        2.74,
      ),
  );
  const squash: ReturnType<typeof AutoMovieArchetypeSquashCourt.create> = AutoMovieArchetypeSquashCourt.create();
  TestValidator.predicate(
    "the squash court's walls, tin and T are the WSF's",
    nclose(
      squash.affordance("front").frame.translation.z -
        squash.affordance("back").frame.translation.z,
      9.75,
    ) &&
      nclose(squash.affordance("tin").frame.translation.y, 0.48) &&
      nclose(
        squash.affordance("front").frame.translation.z -
          squash.affordance("t").frame.translation.z,
        5.44,
      ),
  );
  const padel: ReturnType<typeof AutoMovieArchetypePadelCourt.create> = AutoMovieArchetypePadelCourt.create();
  TestValidator.predicate(
    "the padel court's net and back walls are the FIP's",
    nclose(padel.affordance("net").frame.translation.y, 0.88) &&
      nclose(
        padel.affordance("far").frame.translation.z -
          padel.affordance("end").frame.translation.z,
        20,
      ),
  );
}
