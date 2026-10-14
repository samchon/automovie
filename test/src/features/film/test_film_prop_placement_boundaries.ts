import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMovieValidation, IAutoMovieConstraintViolation, IAutoMoviePropRelationTarget, IAutoMoviePropRelation, IAutoMovieBuiltElement } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { charger, inSpace, propEnvironment, propRegistry, propSet, table } from "../internal/propPlacementFixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Every original refusal keeps the exact adjacent accepted or unmeasurable boundary.
 *
 * Scenarios:
 * 1. Keep all seventeen original contact, clearance, passage, support, ambiguous, cyclic and degenerate outcomes without changing tolerances.
 * 2. A declared contact between `(a, b\u0000c)` remains valid, while its colliding legacy key must not exempt the separate overlapping pair `(a\u0000b, c)`.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the existing seventeen isolated mutations through real placement validation and requires their accepted or unmeasurable outcomes and selective refusal paths, then requires independent admission/refusal of two different contact pairs whose original NUL-delimited keys collide.
 * @evidence contracts/testing.md#independent-expectations Authored exact contact, declared contact, missing measurable support and invalid/ambiguous fields determine permitted diagnoses. The new two pairs retain the original table/charger boxes and separate the pairs by three metres along each horizontal axis; only the first declares attachment, so only that pair may overlap. Literal nonblank IDs containing NUL are valid inputs rather than a reason to restrict admission.
 * @evidence contracts/testing.md#distinguishing-cases Preserves every original contact, clearance, footprint, cross-building, cell-less, unmodelled, cyclic, ruled-patch, edge-on, ambiguous and self-support neighbor. The declared two-record pair must still validate and the four-record registry must locate the unrelated pair's overlap without changing ID acceptance or geometric tolerances.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_boundaries and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_boundaries(): void {
  const scenario: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = createFilmPropPlacementScenario();
  const { validate, tolerated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CABINET, DOOR, CRATE, SCULPTURE }: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = scenario;
  TestValidator.equals(
    "each refusal has an adjacent case where it must not fire",
    namedFacts([
      [
        "exactContactIsNotOccupancy",
        (): boolean =>
          tolerated(
            (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[PENDANT]!.position = { x: 0, y: 2.6, z: -2 }),
          ),
      ],
      [
        "declaredContactMayOverlap",
        (): boolean =>
          tolerated(
            (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } => (set[CHARGER]!.position = { x: 0, y: 0.15, z: 0 }),
          ),
      ],
      [
        "cellLessSpaceContainsAnything",
        (): boolean =>
          tolerated(
            (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } =>
              (set[CRATE]!.position = { x: 900, y: 900, z: 900 }),
          ),
      ],
      [
        "unfilledOpeningNeverBlocks",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments[0]!.openings[0]!.fill = null;
            props.splice(DOOR, 1);
            set.splice(DOOR, 1);
            set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 };
          }),
      ],
      [
        "unmodelledFillNeverBlocks",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments[0]!.models = [];
            props.splice(DOOR, 1);
            set.splice(DOOR, 1);
            set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 };
          }),
      ],
      [
        "placementlessPropIsNeitherJudgedNorCounted",
        (): boolean =>
          tolerated(
            (_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): { x: number; y: number; z: number; } =>
              (set[SCULPTURE]!.position = { x: 0, y: 0.3, z: 0.3 }),
          ),
      ],
      [
        "clearanceOverInvalidBoxDoesNotThrow",
        (): boolean => {
          const props: IAutoMoviePropSpec[] = propRegistry();
          const set: IAutoMovieStageSetPiece[] = propSet();
          const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
          props[LAMP]!.placement!.clearance[0]!.min.x = NaN;
          set[CHARGER]!.position = { x: 1.5, y: 0.9, z: 0 };
          const result: IAutoMovieValidation = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path === "$input.props[1].placement.clearance[0].x",
            ) &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean => !item.expected.includes("intersects staged prop"),
            )
          );
        },
      ],
      [
        "withoutThatFootprintTheSameGapIsClear",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): void => {
            props[CABINET]!.placement!.footprint = null;
            set[SCONCE]!.position = { x: -4, y: 0.3, z: 3.8 };
          }),
      ],
      [
        "degenerateFootprintIsNotAlsoMismeasured",
        (): boolean => {
          const props: IAutoMoviePropSpec[] = propRegistry();
          const set: IAutoMovieStageSetPiece[] = propSet();
          const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
          props[CABINET]!.placement!.footprint!.min.x = NaN;
          const result: IAutoMovieValidation = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item: IAutoMovieConstraintViolation): boolean => item.path === "$input.props[6].placement.footprint.x",
            ) &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean => !item.expected.includes("leaves logical space"),
            )
          );
        },
      ],
      [
        "relationsAcrossTwoBuildingsMeasureNothing",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[], _set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments.push(propEnvironment("annexe"));
            props[CABINET]!.placement!.relations.splice(0, 1);
            const target: IAutoMoviePropRelationTarget = props[CABINET]!.placement!.relations[0]!.target;
            if (target.kind === "boundary") target.environment = "annexe";
          }),
      ],
      [
        "propAffordanceAloneLocatesNothing",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[]): IAutoMoviePropRelation[] => props[LAMP]!.placement!.relations.splice(0, 1)),
      ],
      [
        "supportingPropWithoutPlacementMakesNoClaim",
        (): boolean => tolerated((props: IAutoMoviePropSpec[]): boolean => delete props[TABLE]!.placement),
      ],
      [
        "cyclicElementParentDoesNotHang",
        (): boolean =>
          tolerated((_props: IAutoMoviePropSpec[], _set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]): void => {
            environments[0]!.elements = environments[0]!.elements.map(
              (element: IAutoMovieBuiltElement): IAutoMovieBuiltElement =>
                element.id === "root"
                  ? { ...element, parent: "door-leaf" }
                  : element,
            );
          }),
      ],
      [
        "aRuledPatchIsRestedOnAtItsOwnHeight",
        (): boolean =>
          tolerated((props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): void => {
            props[CABINET]!.placement!.relations[0] = inSpace("annex");
            const target: IAutoMoviePropRelationTarget = props[CABINET]!.placement!.relations[2]!.target;
            if (target.kind === "surface") target.surface = "annex-floor";
            set[CABINET]!.position = { x: 7.5, y: 0.8, z: 0 };
          }),
      ],
      [
        "aTopStagedEdgeOnIsNotJudged",
        (): boolean =>
          tolerated((_props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[]): void => {
            set[TABLE]!.rotation = {
              x: Math.SQRT1_2,
              y: 0,
              z: 0,
              w: Math.SQRT1_2,
            };
            set[TABLE]!.position = { x: 0, y: 0.1, z: 0 };
          }),
      ],
      [
        "anAmbiguousHostBearsNothing",
        (): boolean => {
          const props: IAutoMoviePropSpec[] = propRegistry();
          const set: IAutoMovieStageSetPiece[] = propSet();
          const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
          props.push(props[TABLE]!);
          set[LAMP]!.position.y = 1.2;
          const result: IAutoMovieValidation = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path ===
                  "$input.props[1].placement.relations[1].target.prop" &&
                item.expected.includes("ambiguous"),
            ) &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean => !item.expected.includes("floats above"),
            )
          );
        },
      ],
      [
        "selfSupportIsNamedRatherThanMeasured",
        (): boolean => {
          const props: IAutoMoviePropSpec[] = propRegistry();
          const set: IAutoMovieStageSetPiece[] = propSet();
          const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
          props[TABLE]!.placement!.relations[1] = {
            kind: "on-support",
            target: {
              kind: "prop-affordance",
              prop: "table",
              affordance: "top",
            },
          };
          const result: IAutoMovieValidation = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path ===
                  "$input.props[0].placement.relations[1].target.prop" &&
                item.expected.includes("cannot rest on"),
            ) &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean => !item.expected.includes("sinks into"),
            )
          );
        },
      ],
    ]),
    {
      exactContactIsNotOccupancy: true,
      declaredContactMayOverlap: true,
      cellLessSpaceContainsAnything: true,
      unfilledOpeningNeverBlocks: true,
      unmodelledFillNeverBlocks: true,
      placementlessPropIsNeitherJudgedNorCounted: true,
      clearanceOverInvalidBoxDoesNotThrow: true,
      withoutThatFootprintTheSameGapIsClear: true,
      degenerateFootprintIsNotAlsoMismeasured: true,
      relationsAcrossTwoBuildingsMeasureNothing: true,
      propAffordanceAloneLocatesNothing: true,
      supportingPropWithoutPlacementMakesNoClaim: true,
      cyclicElementParentDoesNotHang: true,
      aRuledPatchIsRestedOnAtItsOwnHeight: true,
      aTopStagedEdgeOnIsNotJudged: true,
      anAmbiguousHostBearsNothing: true,
      selfSupportIsNamedRatherThanMeasured: true,
    },
  );

  const declaredHost: IAutoMoviePropSpec = table();
  declaredHost.node = declaredHost.model.id = "a";
  const declaredGuest: IAutoMoviePropSpec = charger();
  declaredGuest.node = declaredGuest.model.id = "b\u0000c";
  const contactTarget: IAutoMoviePropRelationTarget = declaredGuest.placement!.relations[1]!.target;
  if (contactTarget.kind !== "prop-affordance")
    throw new Error("the canonical charger must declare its table socket attachment");
  contactTarget.prop = declaredHost.node;
  const unrelatedHost: IAutoMoviePropSpec = table();
  unrelatedHost.node = unrelatedHost.model.id = "a\u0000b";
  const unrelatedGuest: IAutoMoviePropSpec = charger();
  unrelatedGuest.node = unrelatedGuest.model.id = "c";
  unrelatedGuest.placement!.relations.splice(1, 1);
  const pairProps: IAutoMoviePropSpec[] = [declaredHost, declaredGuest, unrelatedHost, unrelatedGuest];
  const pairSet: IAutoMovieStageSetPiece[] = [
    { node: declaredHost.node, model: declaredHost.model.id, position: { x: 0, y: 0.3, z: 0 } },
    { node: declaredGuest.node, model: declaredGuest.model.id, position: { x: 0, y: 0.15, z: 0 } },
    { node: unrelatedHost.node, model: unrelatedHost.model.id, position: { x: 3, y: 0.3, z: 3 } },
    { node: unrelatedGuest.node, model: unrelatedGuest.model.id, position: { x: 3, y: 0.15, z: 3 } },
  ];
  TestValidator.equals("declared contact does not exempt a distinct pair with a colliding legacy key", namedFacts([
    ["declaredPairRemainsValid", (): boolean => validate(pairProps.slice(0, 2), pairSet.slice(0, 2)).success],
    ["unrelatedPairStillRefused", (): boolean => {
      const result: IAutoMovieValidation = validate(pairProps, pairSet);
      return result.success === false && result.violations.some((item: IAutoMovieConstraintViolation): boolean =>
        item.kind === "range" && item.path === "$input.props[3].placement.footprint" &&
        item.expected.includes("declares no contact with it"));
    }],
  ]), { declaredPairRemainsValid: true, unrelatedPairStillRefused: true });
}
