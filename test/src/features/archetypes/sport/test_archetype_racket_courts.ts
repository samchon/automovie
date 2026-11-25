import {
  createPadelCourt,
  createSquashCourt,
  createTableTennisTable,
} from "@automovie/archetypes";
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
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three models' scenarios with each expected dimension in metres and the shared tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Reads each model's affordances, the places a rally is played across.
 * @evidence contracts/development/testing.md#independent-expectations The expected numbers are the ITTF Laws', the WSF court specification's and the FIP rules' own, written here as the documents give them.
 * @evidence contracts/development/testing.md#distinguishing-cases Each model's height and length are read separately, so a swapped axis or a dimension of another sport fails.
 * @evidence contracts/development/testing.md#execution-ownership Builds the models in memory.
 */
export function test_archetype_racket_courts(): void {
  const table: ReturnType<typeof createTableTennisTable> =
    createTableTennisTable();
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
  const squash: ReturnType<typeof createSquashCourt> = createSquashCourt();
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
  const padel: ReturnType<typeof createPadelCourt> = createPadelCourt();
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
