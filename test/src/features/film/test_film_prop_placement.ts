import { createFilmPropPlacementGeometryCases } from "../internal/createFilmPropPlacementGeometryCases";
import { createFilmPropPlacementIdentityCases } from "../internal/createFilmPropPlacementIdentityCases";
import { validatePropPlacements } from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import {
  inSpace,
  propEnvironment,
  propRegistry,
  propSet,
  sculpture,
} from "./propPlacementFixtures";

const TABLE = 0;
const LAMP = 1;
const SCONCE = 2;
const CHARGER = 3;
const PENDANT = 4;
const CHIME = 5;
const CABINET = 6;
const DOOR = 7;
const CRATE = 8;
const SCULPTURE = 9;

const validate = (
  props: IAutoMoviePropSpec[] = propRegistry(),
  set: IAutoMovieStageSetPiece[] = propSet(),
  builtEnvironments: IAutoMovieBuiltEnvironment[] = [propEnvironment()],
) => validatePropPlacements({ props, set, builtEnvironments });

/**
 * A mutated registry must fail at `path`, and with `message` when one is given.
 *
 * The mutation runs against a fresh registry every time, so a case never
 * inherits the damage of the one before it.
 */
const violated = (
  mutate: (
    props: IAutoMoviePropSpec[],
    set: IAutoMovieStageSetPiece[],
    environments: IAutoMovieBuiltEnvironment[],
  ) => void,
  path: string,
  message?: string,
): boolean => {
  const props = propRegistry();
  const set = propSet();
  const environments = [propEnvironment()];
  mutate(props, set, environments);
  const result = validate(props, set, environments);
  return (
    result.success === false &&
    result.violations.some(
      (item) =>
        item.path === path &&
        (message === undefined || item.expected.includes(message)),
    )
  );
};

/** The same mutation, asserted to leave the registry valid. */
const tolerated = (
  mutate: (
    props: IAutoMoviePropSpec[],
    set: IAutoMovieStageSetPiece[],
    environments: IAutoMovieBuiltEnvironment[],
  ) => void,
): boolean => {
  const props = propRegistry();
  const set = propSet();
  const environments = [propEnvironment()];
  mutate(props, set, environments);
  return validate(props, set, environments).success;
};

/**
 * Semantic prop placement resolves order-independently, judges every relation
 * the architecture graph can answer for, and refuses only what it can measure.
 *
 * Scenarios:
 *
 * 1. A furnished room exercising all six relation kinds against both the building
 *    graph and other props passes, as does its reversal, a legacy registry that
 *    declares no placement at all, and the empty registry.
 * 2. Prop, set-piece, and environment identity failures, a missing or forged
 *    staged join, and a staged model that contradicts the spec are located at
 *    the field that authored the contradiction.
 * 3. Each relation kind refuses a target kind it does not accept, and every
 *    citation (space, element, boundary, opening, surface, prop, affordance)
 *    has a missing, ambiguous, wrong-kind, or cross-environment negative twin.
 * 4. A prop occupies at most one space and fills at most one opening, a relation
 *    cannot be declared twice for the same target, and a support graph closing
 *    on itself is refused both directly and through a cycle.
 * 5. Footprint and clearance boxes are gated on all three axes before any geometry
 *    runs, and an invalid box does not make the geometry pass throw.
 * 6. Containment, opening fit, prop overlap, clearance intrusion, and blocked
 *    opening and connector each fail once and are each paired with the adjacent
 *    case where they must not fire: exact contact, a declared contact pair, a
 *    cell-less space, an unfilled opening, and a prop that declares no
 *    placement at all.
 * 7. A prop that names a support is judged against it on both faces a support can
 *    be: a building patch and another prop's top each refuse a prop floating
 *    above them, sunk into them, and standing off them, and each accept the
 *    prop that rests exactly on them, including on a patch whose height comes
 *    from a rule rather than an anchor. Two supports are judged one by one. A
 *    face the record cannot state, a host that is not soundly staged, and a
 *    prop citing its own top are left unmeasured instead of answering for a
 *    fault already named.
 */
export const test_film_prop_placement = (): void => {
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

  TestValidator.equals(
    "identity, relation, box and geometry failures are located",
    namedFacts([
      ...createFilmPropPlacementIdentityCases({ violated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CHIME, CABINET, DOOR, CRATE, SCULPTURE }),
      ...createFilmPropPlacementGeometryCases({ violated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CHIME, CABINET, DOOR, CRATE, SCULPTURE }),
    ]),
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

  TestValidator.equals(
    "each refusal has an adjacent case where it must not fire",
    namedFacts([
      [
        "exactContactIsNotOccupancy",
        () =>
          tolerated(
            (_props, set) => (set[PENDANT]!.position = { x: 0, y: 2.6, z: -2 }),
          ),
      ],
      [
        "declaredContactMayOverlap",
        () =>
          tolerated(
            (_props, set) => (set[CHARGER]!.position = { x: 0, y: 0.15, z: 0 }),
          ),
      ],
      [
        "cellLessSpaceContainsAnything",
        () =>
          tolerated(
            (_props, set) =>
              (set[CRATE]!.position = { x: 900, y: 900, z: 900 }),
          ),
      ],
      [
        "unfilledOpeningNeverBlocks",
        () =>
          tolerated((props, set, environments) => {
            environments[0]!.openings[0]!.fill = null;
            props.splice(DOOR, 1);
            set.splice(DOOR, 1);
            set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 };
          }),
      ],
      [
        "unmodelledFillNeverBlocks",
        () =>
          tolerated((props, set, environments) => {
            environments[0]!.models = [];
            props.splice(DOOR, 1);
            set.splice(DOOR, 1);
            set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 };
          }),
      ],
      [
        "placementlessPropIsNeitherJudgedNorCounted",
        () =>
          tolerated(
            (_props, set) =>
              (set[SCULPTURE]!.position = { x: 0, y: 0.3, z: 0.3 }),
          ),
      ],
      [
        "clearanceOverInvalidBoxDoesNotThrow",
        () => {
          const props = propRegistry();
          const set = propSet();
          const environments = [propEnvironment()];
          props[LAMP]!.placement!.clearance[0]!.min.x = NaN;
          set[CHARGER]!.position = { x: 1.5, y: 0.9, z: 0 };
          const result = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item) =>
                item.path === "$input.props[1].placement.clearance[0].x",
            ) &&
            result.violations.every(
              (item) => !item.expected.includes("intersects staged prop"),
            )
          );
        },
      ],
      [
        "withoutThatFootprintTheSameGapIsClear",
        () =>
          tolerated((props, set) => {
            props[CABINET]!.placement!.footprint = null;
            set[SCONCE]!.position = { x: -4, y: 0.3, z: 3.8 };
          }),
      ],
      [
        "degenerateFootprintIsNotAlsoMismeasured",
        () => {
          const props = propRegistry();
          const set = propSet();
          const environments = [propEnvironment()];
          props[CABINET]!.placement!.footprint!.min.x = NaN;
          const result = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item) => item.path === "$input.props[6].placement.footprint.x",
            ) &&
            result.violations.every(
              (item) => !item.expected.includes("leaves logical space"),
            )
          );
        },
      ],
      [
        "relationsAcrossTwoBuildingsMeasureNothing",
        () =>
          tolerated((props, _set, environments) => {
            environments.push(propEnvironment("annexe"));
            props[CABINET]!.placement!.relations.splice(0, 1);
            const target = props[CABINET]!.placement!.relations[0]!.target;
            if (target.kind === "boundary") target.environment = "annexe";
          }),
      ],
      [
        "propAffordanceAloneLocatesNothing",
        () =>
          tolerated((props) => props[LAMP]!.placement!.relations.splice(0, 1)),
      ],
      [
        "supportingPropWithoutPlacementMakesNoClaim",
        () => tolerated((props) => delete props[TABLE]!.placement),
      ],
      [
        "cyclicElementParentDoesNotHang",
        () =>
          tolerated((_props, _set, environments) => {
            environments[0]!.elements = environments[0]!.elements.map(
              (element) =>
                element.id === "root"
                  ? { ...element, parent: "door-leaf" }
                  : element,
            );
          }),
      ],
      [
        "aRuledPatchIsRestedOnAtItsOwnHeight",
        () =>
          tolerated((props, set) => {
            props[CABINET]!.placement!.relations[0] = inSpace("annex");
            const target = props[CABINET]!.placement!.relations[2]!.target;
            if (target.kind === "surface") target.surface = "annex-floor";
            set[CABINET]!.position = { x: 7.5, y: 0.8, z: 0 };
          }),
      ],
      [
        "aTopStagedEdgeOnIsNotJudged",
        () =>
          tolerated((_props, set) => {
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
        () => {
          const props = propRegistry();
          const set = propSet();
          const environments = [propEnvironment()];
          props.push(props[TABLE]!);
          set[LAMP]!.position.y = 1.2;
          const result = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item) =>
                item.path ===
                  "$input.props[1].placement.relations[1].target.prop" &&
                item.expected.includes("ambiguous"),
            ) &&
            result.violations.every(
              (item) => !item.expected.includes("floats above"),
            )
          );
        },
      ],
      [
        "selfSupportIsNamedRatherThanMeasured",
        () => {
          const props = propRegistry();
          const set = propSet();
          const environments = [propEnvironment()];
          props[TABLE]!.placement!.relations[1] = {
            kind: "on-support",
            target: {
              kind: "prop-affordance",
              prop: "table",
              affordance: "top",
            },
          };
          const result = validate(props, set, environments);
          return (
            result.success === false &&
            result.violations.some(
              (item) =>
                item.path ===
                  "$input.props[0].placement.relations[1].target.prop" &&
                item.expected.includes("cannot rest on"),
            ) &&
            result.violations.every(
              (item) => !item.expected.includes("sinks into"),
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
};
