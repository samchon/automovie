import type { namedFacts } from "./predicates";
import type { IFilmPropPlacementCaseInputs } from "./IFilmPropPlacementCaseInputs";
import { inSpace, propEnvironment } from "../film/propPlacementFixtures";

/** Preserve the original multiplicity, bounds and geometric refusal predicate order. */
export function createFilmPropPlacementGeometryCases(input: IFilmPropPlacementCaseInputs): Parameters<typeof namedFacts>[0] {
  const { violated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CABINET, DOOR } = input;
  return [
      // 4. relation multiplicity and the support graph.
      [
        "duplicateRelation",
        () =>
          violated(
            (props) =>
              props[SCONCE]!.placement!.relations.push(
                props[SCONCE]!.placement!.relations[1]!,
              ),
            "$input.props[2].placement.relations[2]",
            "declared twice",
          ),
      ],
      [
        "secondOccupiedSpace",
        () =>
          violated(
            (props) =>
              props[SCONCE]!.placement!.relations.push(inSpace("annex")),
            "$input.props[2].placement.relations[2].kind",
            "at most one logical space",
          ),
      ],
      [
        "secondFilledOpening",
        () =>
          violated(
            (props) =>
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
        () =>
          violated(
            (props, _set, environments) => {
              environments.push(propEnvironment("annexe"));
              const target = props[DOOR]!.placement!.relations[1]!.target;
              if (target.kind === "opening") target.environment = "annexe";
            },
            "$input.props[7].placement.relations[1].target.environment",
            "differs from occupied space environment",
          ),
      ],
      [
        "supportCycle",
        () =>
          violated(
            (props) => {
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
        () =>
          violated(
            (props) => (props[CABINET]!.placement!.footprint!.max.x = -1),
            "$input.props[6].placement.footprint.x",
            "min < max",
          ),
      ],
      [
        "blankClearanceId",
        () =>
          violated(
            (props) => (props[LAMP]!.placement!.clearance[0]!.id = " "),
            "$input.props[1].placement.clearance[0].id",
            "non-empty",
          ),
      ],
      [
        "duplicateClearanceId",
        () =>
          violated(
            (props) =>
              props[LAMP]!.placement!.clearance.push(
                props[LAMP]!.placement!.clearance[0]!,
              ),
            "$input.props[1].placement.clearance[1].id",
            "duplicated",
          ),
      ],
      [
        "clearanceXOrder",
        () =>
          violated(
            (props) => (props[LAMP]!.placement!.clearance[0]!.max.x = -1),
            "$input.props[1].placement.clearance[0].x",
          ),
      ],
      [
        "clearanceYNotFinite",
        () =>
          violated(
            (props) => (props[LAMP]!.placement!.clearance[0]!.min.y = NaN),
            "$input.props[1].placement.clearance[0].y",
          ),
      ],
      [
        "clearanceZInfinite",
        () =>
          violated(
            (props) => (props[LAMP]!.placement!.clearance[0]!.max.z = Infinity),
            "$input.props[1].placement.clearance[0].z",
          ),
      ],
      // 6. geometry.
      [
        "leavesOccupiedSpace",
        () =>
          violated(
            (_props, set) => (set[PENDANT]!.position = { x: 0, y: 3, z: 12 }),
            "$input.props[4].placement.relations[0].target.space",
            "leaves logical space",
          ),
      ],
      [
        "doorDoesNotFitOpening",
        () =>
          violated(
            (_props, set) => (set[DOOR]!.scale = 3),
            "$input.props[7].placement.relations[1].target.opening",
            "does not fit the fill element",
          ),
      ],
      [
        "spacelessLeafIsStillMeasured",
        () =>
          violated(
            (props, set) => {
              props[DOOR]!.placement!.relations.splice(0, 1);
              set[DOOR]!.scale = 3;
            },
            "$input.props[7].placement.relations[0].target.opening",
            "does not fit the fill element",
          ),
      ],
      [
        "declaredFootprintWidensWhatIsRefused",
        () =>
          violated(
            (_props, set) =>
              (set[SCONCE]!.position = { x: -4, y: 0.3, z: 3.8 }),
            "$input.props[6].placement.footprint",
            'overlaps prop "sconce"',
          ),
      ],
      [
        "occupancyOverlapsUndeclaredProp",
        () =>
          violated(
            (_props, set) => (set[PENDANT]!.position = { x: 0, y: 2, z: -2 }),
            "$input.props[5].placement.footprint",
            "declares no contact with it",
          ),
      ],
      [
        "clearanceIntersectsProp",
        () =>
          violated(
            (_props, set) =>
              (set[CHARGER]!.position = { x: 1.5, y: 0.9, z: 0 }),
            "$input.props[1].placement.clearance[0]",
            "intersects staged prop",
          ),
      ],
      [
        "blocksOpening",
        () =>
          violated(
            (_props, set) => (set[SCONCE]!.position = { x: 3.9, y: 1, z: 0 }),
            "$input.props[2].placement",
            'blocks opening "doorway"',
          ),
      ],
      [
        "blocksConnector",
        () =>
          violated(
            (_props, set) => (set[SCONCE]!.position = { x: -4.5, y: 1, z: -3 }),
            "$input.props[2].placement",
            'blocks connector "stair"',
          ),
      ],
      // 7. bearing on the support a prop names.
      [
        "floatsAboveItsPatch",
        () =>
          violated(
            (_props, set) => (set[CABINET]!.position.y = 0.5),
            "$input.props[6].placement.relations[2].target.surface",
            'floats above support surface "floor"',
          ),
      ],
      [
        "sinksIntoItsPatch",
        () =>
          violated(
            (_props, set) => (set[CABINET]!.position.y = 0.1),
            "$input.props[6].placement.relations[2].target.surface",
            'sinks into support surface "floor"',
          ),
      ],
      [
        "standsOffItsPatch",
        () =>
          violated(
            (props) => {
              const target = props[CABINET]!.placement!.relations[2]!.target;
              if (target.kind === "surface") target.surface = "annex-floor";
            },
            "$input.props[6].placement.relations[2].target.surface",
            'does not stand over support surface "annex-floor"',
          ),
      ],
      [
        "aSecondSupportIsJudgedOnItsOwn",
        () =>
          violated(
            (props) =>
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
        () =>
          violated(
            (_props, set) => (set[LAMP]!.position.y = 1.2),
            "$input.props[1].placement.relations[1].target.affordance",
            'floats above prop "table" affordance "top"',
          ),
      ],
      [
        "sinksIntoItsHostTop",
        () =>
          violated(
            (_props, set) => (set[LAMP]!.position.y = 0.8),
            "$input.props[1].placement.relations[1].target.affordance",
            'sinks into prop "table" affordance "top"',
          ),
      ],
      [
        "standsOffItsHostTop",
        () =>
          violated(
            (_props, set) => (set[LAMP]!.position = { x: 0, y: 0.96, z: 3 }),
            "$input.props[1].placement.relations[1].target.affordance",
            'does not stand over prop "table" affordance "top"',
          ),
      ],
  ];
}
