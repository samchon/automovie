import { planNamedVault } from "@automovie/motions/internal";
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
