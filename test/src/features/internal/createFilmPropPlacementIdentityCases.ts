import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMoviePropRelationTarget } from "@automovie/interface";
import { inSpace, propEnvironment } from "./propPlacementFixtures";
import type { IFilmPropPlacementCaseInputs } from "./IFilmPropPlacementCaseInputs";
import type { namedFacts } from "./predicates";

/**
 * Preserve the original identity and relation citation predicate order.
 *
 * Behavior: Returns the original ordered identity/join/citation mutation predicates executed by the identity entry through real placement validation.
 * Expectation basis: The authored registry ids and relation/affordance contracts determine each literal refusal path/message; observed predicate results are not reused as the outer all-true expectation.
 * Cases: Keeps every duplicate, ambiguous/missing join, failed forge, invalid target kind, dangling reference, self-support and wrong/cross-environment affordance case.
 * Execution: The existing owning entries call createFilmPropPlacementIdentityCases during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function createFilmPropPlacementIdentityCases(
  input: IFilmPropPlacementCaseInputs,
): Parameters<typeof namedFacts>[0] {
  const { violated, TABLE, LAMP, SCONCE, CHARGER, CHIME, CABINET, DOOR }: IFilmPropPlacementCaseInputs =
    input;
  return [
    // 2. identity and the staged join.
    [
      "duplicateProp",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => props.push(props[TABLE]!),
          "$input.props[10].node",
          "duplicated",
        ),
    ],
    [
      "ambiguousSupportingProp",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => props.push(props[TABLE]!),
          "$input.props[1].placement.relations[1].target.prop",
          "ambiguous",
        ),
    ],
    [
      "duplicateSet",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => set.push(set[TABLE]!),
          "$input.set[10].node",
          "duplicated",
        ),
    ],
    [
      "duplicateEnvironment",
      (): boolean =>
        violated(
          (_p: IAutoMoviePropSpec[], _s: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): number => environments.push(propEnvironment()),
          "$input.builtEnvironments[1].id",
          "duplicated",
        ),
    ],
    [
      "ambiguousEnvironment",
      (): boolean =>
        violated(
          (_p: IAutoMoviePropSpec[], _s: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): number => environments.push(propEnvironment()),
          "$input.props[0].placement.relations[0].target.environment",
          "ambiguous",
        ),
    ],
    [
      "forgeFailure",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): string => (props[TABLE]!.model.id = "wrong"),
          "$input.props[0].model.id",
        ),
    ],
    [
      "missingStagedPiece",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): IAutoMovieStageSetPiece[] => set.splice(LAMP, 1),
          "$input.props[1].node",
          "needs one staged set placement",
        ),
    ],
    [
      "stagedModelMismatch",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): string => (set[LAMP]!.model = "wrong"),
          "$input.set[1].model",
          "instead of",
        ),
    ],
    // 3. relation shape and citations.
    [
      "unacceptedTargetKind",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): { kind: "in-space"; target: { kind: "element"; environment: string; element: string; }; } =>
            (props[TABLE]!.placement!.relations[0] = {
              kind: "in-space",
              target: {
                kind: "element",
                environment: "house",
                element: "wall",
              },
            }),
          "$input.props[0].placement.relations[0].target.kind",
          'does not accept a "element" target',
        ),
    ],
    [
      "unacceptedPropAffordanceTarget",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): { kind: "fill-opening"; target: { kind: "prop-affordance"; prop: string; affordance: string; }; } =>
            (props[DOOR]!.placement!.relations[1] = {
              kind: "fill-opening",
              target: {
                kind: "prop-affordance",
                prop: "table",
                affordance: "top",
              },
            }),
          "$input.props[7].placement.relations[1].target.kind",
          'does not accept a "prop-affordance" target',
        ),
    ],
    [
      "unacceptedSupportTargetKind",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): { kind: "on-support"; target: { kind: "boundary"; environment: string; boundary: string; }; } =>
            (props[CABINET]!.placement!.relations[2] = {
              kind: "on-support",
              target: {
                kind: "boundary",
                environment: "house",
                boundary: "room-wall",
              },
            }),
          "$input.props[6].placement.relations[2].target.kind",
          'does not accept a "boundary" target',
        ),
    ],
    [
      "missingEnvironment",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[TABLE]!.placement!.relations[0]!.target;
            if (target.kind === "space") target.environment = "missing";
          },
          "$input.props[0].placement.relations[0].target.environment",
          "does not resolve",
        ),
    ],
    [
      "missingSpace",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[TABLE]!.placement!.relations[0]!.target;
            if (target.kind === "space") target.space = "missing";
          },
          "$input.props[0].placement.relations[0].target.space",
          "does not resolve",
        ),
    ],
    [
      "missingElement",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[SCONCE]!.placement!.relations[1]!.target;
            if (target.kind === "element") target.element = "missing";
          },
          "$input.props[2].placement.relations[1].target.element",
          "does not resolve",
        ),
    ],
    [
      "missingBoundary",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[CABINET]!.placement!.relations[1]!.target;
            if (target.kind === "boundary") target.boundary = "missing";
          },
          "$input.props[6].placement.relations[1].target.boundary",
          "does not resolve",
        ),
    ],
    [
      "missingOpening",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[DOOR]!.placement!.relations[1]!.target;
            if (target.kind === "opening") target.opening = "missing";
          },
          "$input.props[7].placement.relations[1].target.opening",
          "does not resolve",
        ),
    ],
    [
      "missingSurface",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[TABLE]!.placement!.relations[1]!.target;
            if (target.kind === "surface") target.surface = "missing";
          },
          "$input.props[0].placement.relations[1].target.surface",
          "does not resolve",
        ),
    ],
    [
      "crossEnvironmentRelation",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[], _set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments.push(propEnvironment("annexe"));
            const target: IAutoMoviePropRelationTarget = props[SCONCE]!.placement!.relations[1]!.target;
            if (target.kind === "element") target.environment = "annexe";
          },
          "$input.props[2].placement.relations[1].target.environment",
          "differs from occupied space environment",
        ),
    ],
    [
      "selfSupport",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.prop = "lamp";
          },
          "$input.props[1].placement.relations[1].target.prop",
          "cannot rest on",
        ),
    ],
    [
      "missingSupportingProp",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.prop = "missing";
          },
          "$input.props[1].placement.relations[1].target.prop",
          "does not resolve",
        ),
    ],
    [
      "missingAffordance",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance")
              target.affordance = "missing";
          },
          "$input.props[1].placement.relations[1].target.affordance",
          "does not resolve",
        ),
    ],
    [
      "wrongAffordanceKindForSupport",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "plug";
          },
          "$input.props[1].placement.relations[1].target.affordance",
          'needs a "stack-top" affordance',
        ),
    ],
    [
      "wrongAffordanceKindForAttachment",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[CHARGER]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "peg";
          },
          "$input.props[3].placement.relations[1].target.affordance",
          'needs a "socket" affordance',
        ),
    ],
    [
      "wrongAffordanceKindForSuspension",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[CHIME]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "top";
          },
          "$input.props[5].placement.relations[1].target.affordance",
          'needs a "hook" affordance',
        ),
    ],
    [
      "supportingPropInAnotherEnvironment",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[], _set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments.push(propEnvironment("annexe"));
            props[TABLE]!.placement!.relations[0] = inSpace("room", "annexe");
          },
          "$input.props[1].placement.relations[1].target.prop",
          "occupies environment",
        ),
    ],
  ];
}
