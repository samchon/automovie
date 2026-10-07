import { inSpace, propEnvironment } from "../film/propPlacementFixtures";
import type { IFilmPropPlacementCaseInputs } from "./IFilmPropPlacementCaseInputs";
import type { namedFacts } from "./predicates";

/** Preserve the original identity and relation citation predicate order. */
export function createFilmPropPlacementIdentityCases(
  input: IFilmPropPlacementCaseInputs,
): Parameters<typeof namedFacts>[0] {
  const { violated, TABLE, LAMP, SCONCE, CHARGER, CHIME, CABINET, DOOR } =
    input;
  return [
    // 2. identity and the staged join.
    [
      "duplicateProp",
      () =>
        violated(
          (props) => props.push(props[TABLE]!),
          "$input.props[10].node",
          "duplicated",
        ),
    ],
    [
      "ambiguousSupportingProp",
      () =>
        violated(
          (props) => props.push(props[TABLE]!),
          "$input.props[1].placement.relations[1].target.prop",
          "ambiguous",
        ),
    ],
    [
      "duplicateSet",
      () =>
        violated(
          (_props, set) => set.push(set[TABLE]!),
          "$input.set[10].node",
          "duplicated",
        ),
    ],
    [
      "duplicateEnvironment",
      () =>
        violated(
          (_p, _s, environments) => environments.push(propEnvironment()),
          "$input.builtEnvironments[1].id",
          "duplicated",
        ),
    ],
    [
      "ambiguousEnvironment",
      () =>
        violated(
          (_p, _s, environments) => environments.push(propEnvironment()),
          "$input.props[0].placement.relations[0].target.environment",
          "ambiguous",
        ),
    ],
    [
      "forgeFailure",
      () =>
        violated(
          (props) => (props[TABLE]!.model.id = "wrong"),
          "$input.props[0].model.id",
        ),
    ],
    [
      "missingStagedPiece",
      () =>
        violated(
          (_props, set) => set.splice(LAMP, 1),
          "$input.props[1].node",
          "needs one staged set placement",
        ),
    ],
    [
      "stagedModelMismatch",
      () =>
        violated(
          (_props, set) => (set[LAMP]!.model = "wrong"),
          "$input.set[1].model",
          "instead of",
        ),
    ],
    // 3. relation shape and citations.
    [
      "unacceptedTargetKind",
      () =>
        violated(
          (props) =>
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
      () =>
        violated(
          (props) =>
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
      () =>
        violated(
          (props) =>
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
      () =>
        violated(
          (props) => {
            const target = props[TABLE]!.placement!.relations[0]!.target;
            if (target.kind === "space") target.environment = "missing";
          },
          "$input.props[0].placement.relations[0].target.environment",
          "does not resolve",
        ),
    ],
    [
      "missingSpace",
      () =>
        violated(
          (props) => {
            const target = props[TABLE]!.placement!.relations[0]!.target;
            if (target.kind === "space") target.space = "missing";
          },
          "$input.props[0].placement.relations[0].target.space",
          "does not resolve",
        ),
    ],
    [
      "missingElement",
      () =>
        violated(
          (props) => {
            const target = props[SCONCE]!.placement!.relations[1]!.target;
            if (target.kind === "element") target.element = "missing";
          },
          "$input.props[2].placement.relations[1].target.element",
          "does not resolve",
        ),
    ],
    [
      "missingBoundary",
      () =>
        violated(
          (props) => {
            const target = props[CABINET]!.placement!.relations[1]!.target;
            if (target.kind === "boundary") target.boundary = "missing";
          },
          "$input.props[6].placement.relations[1].target.boundary",
          "does not resolve",
        ),
    ],
    [
      "missingOpening",
      () =>
        violated(
          (props) => {
            const target = props[DOOR]!.placement!.relations[1]!.target;
            if (target.kind === "opening") target.opening = "missing";
          },
          "$input.props[7].placement.relations[1].target.opening",
          "does not resolve",
        ),
    ],
    [
      "missingSurface",
      () =>
        violated(
          (props) => {
            const target = props[TABLE]!.placement!.relations[1]!.target;
            if (target.kind === "surface") target.surface = "missing";
          },
          "$input.props[0].placement.relations[1].target.surface",
          "does not resolve",
        ),
    ],
    [
      "crossEnvironmentRelation",
      () =>
        violated(
          (props, _set, environments) => {
            environments.push(propEnvironment("annexe"));
            const target = props[SCONCE]!.placement!.relations[1]!.target;
            if (target.kind === "element") target.environment = "annexe";
          },
          "$input.props[2].placement.relations[1].target.environment",
          "differs from occupied space environment",
        ),
    ],
    [
      "selfSupport",
      () =>
        violated(
          (props) => {
            const target = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.prop = "lamp";
          },
          "$input.props[1].placement.relations[1].target.prop",
          "cannot rest on",
        ),
    ],
    [
      "missingSupportingProp",
      () =>
        violated(
          (props) => {
            const target = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.prop = "missing";
          },
          "$input.props[1].placement.relations[1].target.prop",
          "does not resolve",
        ),
    ],
    [
      "missingAffordance",
      () =>
        violated(
          (props) => {
            const target = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance")
              target.affordance = "missing";
          },
          "$input.props[1].placement.relations[1].target.affordance",
          "does not resolve",
        ),
    ],
    [
      "wrongAffordanceKindForSupport",
      () =>
        violated(
          (props) => {
            const target = props[LAMP]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "plug";
          },
          "$input.props[1].placement.relations[1].target.affordance",
          'needs a "stack-top" affordance',
        ),
    ],
    [
      "wrongAffordanceKindForAttachment",
      () =>
        violated(
          (props) => {
            const target = props[CHARGER]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "peg";
          },
          "$input.props[3].placement.relations[1].target.affordance",
          'needs a "socket" affordance',
        ),
    ],
    [
      "wrongAffordanceKindForSuspension",
      () =>
        violated(
          (props) => {
            const target = props[CHIME]!.placement!.relations[1]!.target;
            if (target.kind === "prop-affordance") target.affordance = "top";
          },
          "$input.props[5].placement.relations[1].target.affordance",
          'needs a "hook" affordance',
        ),
    ],
    [
      "supportingPropInAnotherEnvironment",
      () =>
        violated(
          (props, _set, environments) => {
            environments.push(propEnvironment("annexe"));
            props[TABLE]!.placement!.relations[0] = inSpace("room", "annexe");
          },
          "$input.props[1].placement.relations[1].target.prop",
          "occupies environment",
        ),
    ],
  ];
}
