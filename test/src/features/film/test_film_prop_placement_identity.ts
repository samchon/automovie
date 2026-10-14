import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { createFilmPropPlacementIdentityCases } from "../internal/createFilmPropPlacementIdentityCases";
import { namedFacts } from "../internal/predicates";

/**
 * Every original identity refusal retains its full addressed field and adjacent physical contract.
 *
 * Scenarios:
 * 1. Locate duplicate and ambiguous prop, staging and environment identities, failed forging and missing or mismatched staged joins.
 * 2. Refuse unsupported relation/target combinations and dangling environment, space, element, boundary, opening and surface references.
 * 3. Distinguish self-support, missing hosts or affordances, and wrong stack-top, socket or hook kinds.
 * 4. Refuse a building relation or supporting prop in a different environment from the occupied space.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the existing identity-case builder and requires every addressed duplicate, join, target-kind, missing-reference and affordance refusal from real placement validation.
 * @evidence contracts/testing.md#independent-expectations Literal registry identities, relation-kind rules and independently selected missing/ambiguous targets supply the expected paths and all-true predicates rather than a copied validator output.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all original duplicate prop/set/environment, failed forge, missing/mismatched staged join, unsupported target, missing citation, self-support, wrong affordance and cross-environment cases; geometric and positive neighbors remain in sibling entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_identity and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_identity(): void {
  const scenario: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = createFilmPropPlacementScenario();
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
}
