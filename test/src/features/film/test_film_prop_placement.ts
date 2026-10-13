import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { propRegistry, propSet, sculpture } from "../internal/propPlacementFixtures";

/**
 * Semantic placement keeps the original furnished-room and legacy compatibility inputs.
 *
 * Scenarios:
 * 1. Accept the full room, reversed declaration order, placementless legacy sculpture and empty registries.
 */
export const test_film_prop_placement = (): void => {
  const scenario = createFilmPropPlacementScenario();
  const { validate, SCULPTURE } = scenario;
  TestValidator.equals("the furnished room resolves", validate().success, true);
  TestValidator.equals(
    "forward references are declaration-order independent",
    validate(propRegistry().reverse(), propSet().reverse()).success,
    true,
  );
  TestValidator.equals(
    "a legacy registry without placements stays compatible",
    validate([sculpture()], [propSet()[SCULPTURE]!], []).success,
    true,
  );
  TestValidator.equals(
    "empty registries stay compatible",
    validate([], [], []).success,
    true,
  );


};
