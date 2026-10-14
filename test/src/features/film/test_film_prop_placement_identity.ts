import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMoviePropRelation,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePropPlacements } from "../../../../packages/engine/src/film/validatePropPlacements";
import { createFilmPropPlacementIdentityCases } from "../internal/createFilmPropPlacementIdentityCases";
import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { namedFacts } from "../internal/predicates";
import { sconce } from "../internal/propPlacementFixtures/sconce";

/**
 * Every original identity refusal retains its full addressed field and adjacent physical contract.
 *
 * Scenarios:
 * 1. Locate duplicate and ambiguous prop, staging and environment identities, failed forging and missing or mismatched staged joins.
 * 2. Refuse unsupported relation/target combinations and dangling environment, space, element, boundary, opening and surface references.
 * 3. Distinguish self-support, missing hosts or affordances, and wrong stack-top, socket or hook kinds.
 * 4. Refuse a building relation or supporting prop in a different environment from the occupied space.
 * 5. Distinguish NUL-containing target field tuples for both building and prop-affordance references while still refusing an exact repeated tuple.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the existing identity-case builder and real validatePropPlacements, requiring every addressed identity refusal and ensuring distinct NUL-containing target fields do not trigger duplicate-relation findings while exact repeated targets do.
 * @evidence contracts/testing.md#independent-expectations Literal registry identities, relation-kind rules and independently selected missing/ambiguous targets supply the expected paths and all-true predicates rather than a copied validator output.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all original identity refusals and adds distinct NUL-containing building and prop-affordance tuples with exact-duplicate controls. These intentionally unresolved targets isolate duplicate diagnosis; valid geometric neighbors remain in sibling entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_identity and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_identity(): void {
  const scenario: {
    validate: (
      props?: IAutoMoviePropSpec[],
      set?: IAutoMovieStageSetPiece[],
      builtEnvironments?: IAutoMovieBuiltEnvironment[],
    ) => IAutoMovieValidation;
    violated: (
      mutate: (
        props: IAutoMoviePropSpec[],
        set: IAutoMovieStageSetPiece[],
        environments: IAutoMovieBuiltEnvironment[],
      ) => void,
      path: string,
      message?: string,
    ) => boolean;
    tolerated: (
      mutate: (
        props: IAutoMoviePropSpec[],
        set: IAutoMovieStageSetPiece[],
        environments: IAutoMovieBuiltEnvironment[],
      ) => void,
    ) => boolean;
    TABLE: number;
    LAMP: number;
    SCONCE: number;
    CHARGER: number;
    PENDANT: number;
    CHIME: number;
    CABINET: number;
    DOOR: number;
    CRATE: number;
    SCULPTURE: number;
  } = createFilmPropPlacementScenario();
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
  for (const targets of [
    [
      { kind: "element", environment: "a\0b", element: "c" },
      { kind: "element", environment: "a", element: "b\0c" },
    ],
    [
      { kind: "prop-affordance", prop: "a\0b", affordance: "c" },
      { kind: "prop-affordance", prop: "a", affordance: "b\0c" },
    ],
  ] as const) {
    const prop: IAutoMoviePropSpec = sconce();
    const relations: IAutoMoviePropRelation[] = targets.map(
      (target: IAutoMoviePropRelationTarget): IAutoMoviePropRelation => ({
        kind: "attached",
        target,
      }),
    );
    prop.placement!.relations = relations;
    const distinct: IAutoMovieValidation = validatePropPlacements({
      props: [prop],
      set: [],
      builtEnvironments: [],
    });
    if (distinct.success) throw new Error("unresolved targets must fail");
    TestValidator.equals(
      `${targets[0].kind} distinct fields retain identity`,
      distinct.violations.filter(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.expected.includes("declared twice for the same target"),
      ).length,
      0,
    );
    relations.push(relations[0]!);
    const repeated: IAutoMovieValidation = validatePropPlacements({
      props: [prop],
      set: [],
      builtEnvironments: [],
    });
    if (repeated.success) throw new Error("repeated target must fail");
    TestValidator.equals(
      `${targets[0].kind} exact duplicate is addressed`,
      repeated.violations
        .filter((item: IAutoMovieConstraintViolation): boolean =>
          item.expected.includes("declared twice for the same target"),
        )
        .map((item: IAutoMovieConstraintViolation): string => item.path),
      ["$input.props[0].placement.relations[2]"],
    );
  }
}
