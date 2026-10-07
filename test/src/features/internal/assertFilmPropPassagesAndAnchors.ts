import { propAnchorFrame, propBlockedPassages } from "@automovie/engine";
import { propRegistry, propSet } from "../film/propPlacementFixtures";
import { namedFacts, vclose } from "./predicates";
import { TestValidator } from "@nestia/e2e";
import type { IFilmPropUtilityInputs } from "./IFilmPropUtilityInputs";

/** Run the original passage and anchor assertions without changing their order or inputs. */
export function assertFilmPropPassagesAndAnchors(input: IFilmPropUtilityInputs): void {
  const { environment, box } = input;
  TestValidator.equals(
    "passages and anchors answer only what the record can support",
    namedFacts([
      [
        "filledOpeningIsBlocked",
        () =>
          propBlockedPassages({
            environment,
            bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
          }).some(
            (blockage) =>
              blockage.kind === "opening" && blockage.id === "doorway",
          ),
      ],
      [
        "sweptConnectorIsBlocked",
        () =>
          propBlockedPassages({
            environment,
            bounds: box(-4.6, 0.5, -3.1, -4.4, 1.5, -2.9),
          }).some(
            (blockage) =>
              blockage.kind === "connector" && blockage.id === "stair",
          ),
      ],
      [
        "openCutIsNeverBlocked",
        () =>
          propBlockedPassages({
            environment,
            bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
          }).length === 1,
      ],
      [
        "unmodelledFillIsNeverBlocked",
        () =>
          propBlockedPassages({
            environment: { ...environment, models: [] },
            bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
          }).length === 0,
      ],
      [
        "unresolvedFillIsNeverBlocked",
        () =>
          propBlockedPassages({
            environment: {
              ...environment,
              elements: environment.elements.filter(
                (element) => element.id !== "door-leaf",
              ),
            },
            bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
          }).length === 0,
      ],
      [
        "degenerateRouteSweepsNothing",
        () =>
          propBlockedPassages({
            environment: {
              ...environment,
              connectors: [
                {
                  ...environment.connectors[0]!,
                  route: [{ x: -4.5, y: 0, z: -3 }],
                },
              ],
            },
            bounds: box(-4.6, 0.5, -3.1, -4.4, 1.5, -2.9),
          }).length === 0,
      ],
      [
        "clearOfEverythingBlocksNothing",
        () =>
          propBlockedPassages({
            environment,
            bounds: box(0, 0, 0, 0.1, 0.1, 0.1),
          }).length === 0,
      ],
      [
        "spaceHasNoFrame",
        () =>
          propAnchorFrame({
            target: { kind: "space", environment: "house", space: "room" },
            environments: [environment],
          }) === null,
      ],
      [
        "elementFrameIsItsWorldTransform",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "element",
                environment: "house",
                element: "door-leaf",
              },
              environments: [environment],
            })!.translation,
            { x: 4, y: 1, z: 0 },
          ),
      ],
      [
        "boundaryFrameIsItsFirstElement",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "boundary",
                environment: "house",
                boundary: "room-wall",
              },
              environments: [environment],
            })!.translation,
            { x: 0, y: 0, z: 0 },
          ),
      ],
      [
        "openingFrameIsItsFill",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "opening",
                environment: "house",
                opening: "doorway",
              },
              environments: [environment],
            })!.translation,
            { x: 4, y: 1, z: 0 },
          ),
      ],
      [
        "anchoredSurfaceFrameIsItsCentroid",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "surface",
                environment: "house",
                surface: "floor",
              },
              environments: [environment],
            })!.translation,
            { x: 0, y: 0, z: 0 },
          ),
      ],
      [
        "ruledSurfaceFrameReadsItsHeightRule",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "surface",
                environment: "house",
                surface: "annex-floor",
              },
              environments: [environment],
            })!.translation,
            { x: 7.5, y: 0.5, z: 0 },
          ),
      ],
      [
        "affordanceFrameRidesItsStagedProp",
        () =>
          vclose(
            propAnchorFrame({
              target: {
                kind: "prop-affordance",
                prop: "table",
                affordance: "top",
              },
              environments: [environment],
              props: propRegistry(),
              set: propSet(),
            })!.translation,
            { x: 0, y: 0.6, z: 0 },
          ),
      ],
      [
        "everyDanglingCitationAnswersNull",
        () =>
          (
            [
              {
                target: {
                  kind: "element",
                  environment: "elsewhere",
                  element: "wall",
                },
              },
              {
                target: {
                  kind: "element",
                  environment: "house",
                  element: "missing",
                },
              },
              {
                target: {
                  kind: "boundary",
                  environment: "house",
                  boundary: "missing",
                },
              },
              {
                target: {
                  kind: "boundary",
                  environment: "house",
                  boundary: "bare-boundary",
                },
              },
              {
                target: {
                  kind: "opening",
                  environment: "house",
                  opening: "missing",
                },
              },
              {
                target: {
                  kind: "opening",
                  environment: "house",
                  opening: "arch",
                },
              },
              {
                target: {
                  kind: "surface",
                  environment: "house",
                  surface: "missing",
                },
              },
              {
                target: {
                  kind: "prop-affordance",
                  prop: "missing",
                  affordance: "top",
                },
              },
              {
                target: {
                  kind: "prop-affordance",
                  prop: "table",
                  affordance: "missing",
                },
              },
            ] as const
          ).every(
            (probe) =>
              propAnchorFrame({
                target: probe.target,
                environments: [environment],
                props: propRegistry(),
                set: propSet(),
              }) === null,
          ),
      ],
      [
        "unstagedAffordanceAnswersNull",
        () =>
          propAnchorFrame({
            target: {
              kind: "prop-affordance",
              prop: "table",
              affordance: "top",
            },
            environments: [environment],
            props: propRegistry(),
          }) === null,
      ],
      [
        "unregisteredPropsAnswerNull",
        () =>
          propAnchorFrame({
            target: {
              kind: "prop-affordance",
              prop: "table",
              affordance: "top",
            },
            environments: [environment],
            set: propSet(),
          }) === null,
      ],
      [
        "cyclicElementChainAnswersNull",
        () =>
          (
            [
              { kind: "element", environment: "house", element: "door-leaf" },
              { kind: "boundary", environment: "house", boundary: "room-wall" },
              { kind: "opening", environment: "house", opening: "doorway" },
            ] as const
          ).every(
            (target) =>
              propAnchorFrame({
                target,
                environments: [
                  {
                    ...environment,
                    elements: environment.elements.map((element) =>
                      element.id === "root"
                        ? { ...element, parent: "door-leaf" }
                        : element,
                    ),
                  },
                ],
              }) === null,
          ),
      ],
      [
        "emptyPolygonSurfaceAnswersNull",
        () =>
          propAnchorFrame({
            target: {
              kind: "surface",
              environment: "house",
              surface: "floor",
            },
            environments: [
              {
                ...environment,
                surfaces: environment.surfaces.map((entry) =>
                  entry.surface.id === "floor"
                    ? { ...entry, surface: { ...entry.surface, polygon: [] } }
                    : entry,
                ),
              },
            ],
          }) === null,
      ],
    ]),
    {
      filledOpeningIsBlocked: true,
      sweptConnectorIsBlocked: true,
      openCutIsNeverBlocked: true,
      unmodelledFillIsNeverBlocked: true,
      unresolvedFillIsNeverBlocked: true,
      degenerateRouteSweepsNothing: true,
      clearOfEverythingBlocksNothing: true,
      spaceHasNoFrame: true,
      elementFrameIsItsWorldTransform: true,
      boundaryFrameIsItsFirstElement: true,
      openingFrameIsItsFill: true,
      anchoredSurfaceFrameIsItsCentroid: true,
      ruledSurfaceFrameReadsItsHeightRule: true,
      affordanceFrameRidesItsStagedProp: true,
      everyDanglingCitationAnswersNull: true,
      unstagedAffordanceAnswersNull: true,
      unregisteredPropsAnswerNull: true,
      cyclicElementChainAnswersNull: true,
      emptyPolygonSurfaceAnswersNull: true,
    },
  );

}
