import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { createFilmPropPlacementIdentityCases } from "../internal/createFilmPropPlacementIdentityCases";
import { namedFacts } from "../internal/predicates";

/**
 * Every original identity refusal retains its full addressed field and adjacent physical contract.
 *
 * Scenarios:
 * 1. Evaluate the unchanged case builder on fresh original registries; retain every original true predicate and refusal path.
 */
export const test_film_prop_placement_identity = (): void => {
  const scenario = createFilmPropPlacementScenario();
  TestValidator.equals(
    "identity and relation citation failures are located",
    namedFacts(createFilmPropPlacementIdentityCases(scenario)),
    {
      duplicateProp: true,
      ambiguousSupportingProp: true,
      duplicateSet: true,
      duplicateEnvironment: true,
      ambiguousEnvironment: true,
      forgeFailure: true,
      missingStagedPiece: true,
      stagedModelMismatch: true,
      unacceptedTargetKind: true,
      unacceptedPropAffordanceTarget: true,
      unacceptedSupportTargetKind: true,
      missingEnvironment: true,
      missingSpace: true,
      missingElement: true,
      missingBoundary: true,
      missingOpening: true,
      missingSurface: true,
      crossEnvironmentRelation: true,
      selfSupport: true,
      missingSupportingProp: true,
      missingAffordance: true,
      wrongAffordanceKindForSupport: true,
      wrongAffordanceKindForAttachment: true,
      wrongAffordanceKindForSuspension: true,
      supportingPropInAnotherEnvironment: true,
    },
  );
};
