import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { inSpace, propEnvironment, propRegistry, propSet } from "../internal/propPlacementFixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Every original refusal keeps the exact adjacent accepted or unmeasurable boundary.
 *
 * Scenarios:
 * 1. Keep all17 original contact, clearance, passage, support, ambiguous, cyclic and degenerate outcomes without changing tolerances.
 */
export const test_film_prop_placement_boundaries = (): void => {
  const scenario = createFilmPropPlacementScenario();
  const { validate, tolerated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CABINET, DOOR, CRATE, SCULPTURE } = scenario;
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
