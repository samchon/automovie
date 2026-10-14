import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMoviePropRelationTarget } from "@automovie/interface";
import { inSpace, propEnvironment } from "./propPlacementFixtures";
import type { IFilmPropPlacementCaseInputs } from "./IFilmPropPlacementCaseInputs";
import type { namedFacts } from "./predicates";

/**
 * Preserve the original multiplicity, bounds and geometric refusal predicate order.
 *
 * Behavior: Returns the original ordered mutation predicates executed by the geometry entry through the supplied real validation reader.
 * Expectation basis: Literal addressed paths and supported multiplicity, finite-volume, passage and signed-bearing rules supply each expected refusal; the outer entry independently requires every returned predicate true.
 * Cases: Preserves every original relation multiplicity, support cycle, malformed bounds/clearances, containment/occupancy/passage and support-gap case; accepted neighbors remain in the boundary entry.
 * Execution: The existing owning entries call createFilmPropPlacementGeometryCases during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function createFilmPropPlacementGeometryCases(
  input: IFilmPropPlacementCaseInputs,
): Parameters<typeof namedFacts>[0] {
  const { violated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CABINET, DOOR }: IFilmPropPlacementCaseInputs =
    input;
  return [
    // 4. relation multiplicity and the support graph.
    [
      "duplicateRelation",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number =>
            props[SCONCE]!.placement!.relations.push(
              props[SCONCE]!.placement!.relations[1]!,
            ),
          "$input.props[2].placement.relations[2]",
          "declared twice",
        ),
    ],
    [
      "secondOccupiedSpace",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => props[SCONCE]!.placement!.relations.push(inSpace("annex")),
          "$input.props[2].placement.relations[2].kind",
          "at most one logical space",
        ),
    ],
    [
      "secondFilledOpening",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number =>
            props[DOOR]!.placement!.relations.push({
              kind: "fill-opening",
              target: {
                kind: "opening",
                environment: "house",
                opening: "arch",
              },
            }),
          "$input.props[7].placement.relations[2].kind",
          "at most one opening",
        ),
    ],
    [
      "filledOpeningInAnotherEnvironment",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[], _set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments.push(propEnvironment("annexe"));
            const target: IAutoMoviePropRelationTarget = props[DOOR]!.placement!.relations[1]!.target;
            if (target.kind === "opening") target.environment = "annexe";
          },
          "$input.props[7].placement.relations[1].target.environment",
          "differs from occupied space environment",
        ),
    ],
    [
      "supportCycle",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            props[TABLE]!.placement!.relations.push({
              kind: "on-support",
              target: {
                kind: "prop-affordance",
                prop: "lamp",
                affordance: "top",
              },
            });
          },
          "$input.props[1].placement.relations[1].target.prop",
          "forms a cycle",
        ),
    ],
    // 5. box gates.
    [
      "footprintAxis",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => (props[CABINET]!.placement!.footprint!.max.x = -1),
          "$input.props[6].placement.footprint.x",
          "min < max",
        ),
    ],
    [
      "blankClearanceId",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): string => (props[LAMP]!.placement!.clearance[0]!.id = " "),
          "$input.props[1].placement.clearance[0].id",
          "non-empty",
        ),
    ],
    [
      "duplicateClearanceId",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number =>
            props[LAMP]!.placement!.clearance.push(
              props[LAMP]!.placement!.clearance[0]!,
            ),
          "$input.props[1].placement.clearance[1].id",
          "duplicated",
        ),
    ],
    [
      "clearanceXOrder",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => (props[LAMP]!.placement!.clearance[0]!.max.x = -1),
          "$input.props[1].placement.clearance[0].x",
        ),
    ],
    [
      "clearanceYNotFinite",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => (props[LAMP]!.placement!.clearance[0]!.min.y = NaN),
          "$input.props[1].placement.clearance[0].y",
        ),
    ],
    [
      "clearanceZInfinite",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number => (props[LAMP]!.placement!.clearance[0]!.max.z = Infinity),
          "$input.props[1].placement.clearance[0].z",
        ),
    ],
    // 6. geometry.
    [
      "leavesOccupiedSpace",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[PENDANT]!.position = { x: 0, y: 3, z: 12 }),
          "$input.props[4].placement.relations[0].target.space",
          "leaves logical space",
        ),
    ],
    [
      "doorDoesNotFitOpening",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => (set[DOOR]!.scale = 3),
          "$input.props[7].placement.relations[1].target.opening",
          "does not fit the fill element",
        ),
    ],
    [
      "spacelessLeafIsStillMeasured",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): void => {
            props[DOOR]!.placement!.relations.splice(0, 1);
            set[DOOR]!.scale = 3;
          },
          "$input.props[7].placement.relations[0].target.opening",
          "does not fit the fill element",
        ),
    ],
    [
      "declaredFootprintWidensWhatIsRefused",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[SCONCE]!.position = { x: -4, y: 0.3, z: 3.8 }),
          "$input.props[6].placement.footprint",
          'overlaps prop "sconce"',
        ),
    ],
    [
      "occupancyOverlapsUndeclaredProp",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[PENDANT]!.position = { x: 0, y: 2, z: -2 }),
          "$input.props[5].placement.footprint",
          "declares no contact with it",
        ),
    ],
    [
      "clearanceIntersectsProp",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[CHARGER]!.position = { x: 1.5, y: 0.9, z: 0 }),
          "$input.props[1].placement.clearance[0]",
          "intersects staged prop",
        ),
    ],
    [
      "blocksOpening",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 }),
          "$input.props[2].placement",
          'blocks opening "doorway"',
        ),
    ],
    [
      "blocksConnector",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[SCONCE]!.position = { x: -4.5, y: 1, z: -3 }),
          "$input.props[2].placement",
          'blocks connector "stair"',
        ),
    ],
    // 7. bearing on the support a prop names.
    [
      "floatsAboveItsPatch",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => (set[CABINET]!.position.y = 0.5),
          "$input.props[6].placement.relations[2].target.surface",
          'floats above support surface "floor"',
        ),
    ],
    [
      "sinksIntoItsPatch",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => (set[CABINET]!.position.y = 0.1),
          "$input.props[6].placement.relations[2].target.surface",
          'sinks into support surface "floor"',
        ),
    ],
    [
      "standsOffItsPatch",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): void => {
            const target: IAutoMoviePropRelationTarget = props[CABINET]!.placement!.relations[2]!.target;
            if (target.kind === "surface") target.surface = "annex-floor";
          },
          "$input.props[6].placement.relations[2].target.surface",
          'does not stand over support surface "annex-floor"',
        ),
    ],
    [
      "aSecondSupportIsJudgedOnItsOwn",
      (): boolean =>
        violated(
          (props: IAutoMoviePropSpec[]): number =>
            props[CABINET]!.placement!.relations.push({
              kind: "on-support",
              target: {
                kind: "surface",
                environment: "house",
                surface: "annex-floor",
              },
            }),
          "$input.props[6].placement.relations[3].target.surface",
          'does not stand over support surface "annex-floor"',
        ),
    ],
    [
      "floatsAboveItsHostTop",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => (set[LAMP]!.position.y = 1.2),
          "$input.props[1].placement.relations[1].target.affordance",
          'floats above prop "table" affordance "top"',
        ),
    ],
    [
      "sinksIntoItsHostTop",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): number => (set[LAMP]!.position.y = 0.8),
          "$input.props[1].placement.relations[1].target.affordance",
          'sinks into prop "table" affordance "top"',
        ),
    ],
    [
      "standsOffItsHostTop",
      (): boolean =>
        violated(
          (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[LAMP]!.position = { x: 0, y: 0.96, z: 3 }),
          "$input.props[1].placement.relations[1].target.affordance",
          'does not stand over prop "table" affordance "top"',
        ),
    ],
  ];
}
