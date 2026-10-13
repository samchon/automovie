import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { createFilmPropPlacementGeometryCases } from "../internal/createFilmPropPlacementGeometryCases";
import { namedFacts } from "../internal/predicates";

/**
 * Every original geometry refusal retains its full addressed field and adjacent physical contract.
 *
 * Scenarios:
 * 1. Evaluate the unchanged case builder on fresh original registries; retain every original true predicate and refusal path.
 */
export const test_film_prop_placement_geometry = (): void => {
  const scenario = createFilmPropPlacementScenario();
  TestValidator.equals(
    "multiplicity, bounds and geometry failures are located",
    namedFacts(createFilmPropPlacementGeometryCases(scenario)),
    {
      duplicateRelation: true,
      secondOccupiedSpace: true,
      secondFilledOpening: true,
      filledOpeningInAnotherEnvironment: true,
      supportCycle: true,
      footprintAxis: true,
      blankClearanceId: true,
      duplicateClearanceId: true,
      clearanceXOrder: true,
      clearanceYNotFinite: true,
      clearanceZInfinite: true,
      leavesOccupiedSpace: true,
      doorDoesNotFitOpening: true,
      spacelessLeafIsStillMeasured: true,
      declaredFootprintWidensWhatIsRefused: true,
      occupancyOverlapsUndeclaredProp: true,
      clearanceIntersectsProp: true,
      blocksOpening: true,
      blocksConnector: true,
      floatsAboveItsPatch: true,
      sinksIntoItsPatch: true,
      standsOffItsPatch: true,
      aSecondSupportIsJudgedOnItsOwn: true,
      floatsAboveItsHostTop: true,
      sinksIntoItsHostTop: true,
      standsOffItsHostTop: true,
    },
  );
};
