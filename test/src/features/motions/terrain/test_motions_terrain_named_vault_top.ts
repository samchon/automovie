import {
  planNamedVault
} from "../../../../../packages/motions/src/terrain/internal/planNamedVault";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Admit a named vault top relative to the entering hip scale.
 *
 * Scenarios:
 *
 * 1. A top exactly one hip height ahead and half a hip height above the floor is
 *    admitted.
 * 2. A top behind, level with the floor, too far or too high is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines forward and vertical extent admission for a named vault top scaled by entering hip height.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the exact forward and raised bounds and varies sign and each excessive component independently.
 * @evidence contracts/development/testing.md#independent-expectations A top one hip height forward and half that height up is admitted at equality. Behind, level, too far and too high are distinct refusals.
 */
export function test_motions_terrain_named_vault_top(): void {
  planNamedVault.admitTop({ near: 1, height: 0.5 }, 1, "deck");
  const refused: readonly planNamedVault.ITop[] = [
    { near: -0.25, height: 0.25 },
    { near: 1.25, height: 0.25 },
    { near: 0.25, height: 0 },
    { near: 0.25, height: 0.75 },
  ];
  for (const top of refused)
    TestValidator.predicate(
      "the raised top must fit both limits",
      throwsError(
        (): void => planNamedVault.admitTop(top, 1, "deck"),
        ["over.point", "crossing range"],
      ),
    );
}
