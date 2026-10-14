import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMoviePassageBlockage, propAnchorFrame, propBlockedPassages } from "@automovie/engine";


import type { IFilmPropUtilityInputs } from "./IFilmPropUtilityInputs";
import { namedFacts, vclose } from "./predicates";
import { propRegistry, propSet } from "./propPlacementFixtures";

/**
 * Run the original passage and anchor assertions without changing their order or inputs.
 *
 * Behavior: Executes the original real passage and anchor queries and requires each named blockage, null answer or numerical frame through the utility entry.
 * Expectation basis: Authored opening/route boxes and element, surface and affordance transforms provide hand-derived locations; vclose compares numerical vectors rather than using a captured output snapshot.
 * Cases: Preserves blocked and unmeasurable openings/routes, clear probes, each anchor kind, dangling citations, cyclic chains and empty surfaces in their original order.
 * Execution: The existing owning entries call assertFilmPropPassagesAndAnchors during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function assertFilmPropPassagesAndAnchors(
  input: IFilmPropUtilityInputs,
): void {
  const { environment, box }: IFilmPropUtilityInputs = input;
  TestValidator.predicate(
    "passages and anchors answer only what the record can support",
    Object.values(
      namedFacts([
        [
          "filledOpeningIsBlocked",
          (): boolean =>
            propBlockedPassages({
              environment,
              bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
            }).some(
              (blockage: IAutoMoviePassageBlockage): boolean =>
                blockage.kind === "opening" && blockage.id === "doorway",
            ),
        ],
        [
          "sweptConnectorIsBlocked",
          (): boolean =>
            propBlockedPassages({
              environment,
              bounds: box(-4.6, 0.5, -3.1, -4.4, 1.5, -2.9),
            }).some(
              (blockage: IAutoMoviePassageBlockage): boolean =>
                blockage.kind === "connector" && blockage.id === "stair",
            ),
        ],
        [
          "openCutIsNeverBlocked",
          (): boolean =>
            propBlockedPassages({
              environment,
              bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
            }).length === 1,
        ],
        [
          "unmodelledFillIsNeverBlocked",
          (): boolean =>
            propBlockedPassages({
              environment: { ...environment, models: [] },
              bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
            }).length === 0,
        ],
        [
          "unresolvedFillIsNeverBlocked",
          (): boolean =>
            propBlockedPassages({
              environment: {
                ...environment,
                elements: environment.elements.filter(
                  (element: IAutoMovieBuiltElement): boolean =>
                    element.id !== "door-leaf",
                ),
              },
              bounds: box(3.9, 0.5, -0.02, 4.1, 1.5, 0.02),
            }).length === 0,
        ],
        [
          "degenerateRouteSweepsNothing",
          (): boolean =>
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
          (): boolean =>
            propBlockedPassages({
              environment,
              bounds: box(0, 0, 0, 0.1, 0.1, 0.1),
            }).length === 0,
        ],
        [
          "spaceHasNoFrame",
          (): boolean =>
            propAnchorFrame({
              target: { kind: "space", environment: "house", space: "room" },
              environments: [environment],
            }) === null,
        ],
        [
          "elementFrameIsItsWorldTransform",
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
              (
                probe:
                  | {
                      readonly target: {
                        readonly kind: "element";
                        readonly environment: "elsewhere";
                        readonly element: "wall";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "element";
                        readonly environment: "house";
                        readonly element: "missing";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "boundary";
                        readonly environment: "house";
                        readonly boundary: "missing";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "boundary";
                        readonly environment: "house";
                        readonly boundary: "bare-boundary";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "opening";
                        readonly environment: "house";
                        readonly opening: "missing";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "opening";
                        readonly environment: "house";
                        readonly opening: "arch";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "surface";
                        readonly environment: "house";
                        readonly surface: "missing";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "prop-affordance";
                        readonly prop: "missing";
                        readonly affordance: "top";
                      };
                    }
                  | {
                      readonly target: {
                        readonly kind: "prop-affordance";
                        readonly prop: "table";
                        readonly affordance: "missing";
                      };
                    },
              ): boolean =>
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
          (): boolean =>
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
          (): boolean =>
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
          (): boolean =>
            (
              [
                { kind: "element", environment: "house", element: "door-leaf" },
                {
                  kind: "boundary",
                  environment: "house",
                  boundary: "room-wall",
                },
                { kind: "opening", environment: "house", opening: "doorway" },
              ] as const
            ).every(
              (
                target:
                  | {
                      readonly kind: "element";
                      readonly environment: "house";
                      readonly element: "door-leaf";
                    }
                  | {
                      readonly kind: "boundary";
                      readonly environment: "house";
                      readonly boundary: "room-wall";
                    }
                  | {
                      readonly kind: "opening";
                      readonly environment: "house";
                      readonly opening: "doorway";
                    },
              ): boolean =>
                propAnchorFrame({
                  target,
                  environments: [
                    {
                      ...environment,
                      elements: environment.elements.map(
                        (
                          element: IAutoMovieBuiltElement,
                        ): IAutoMovieBuiltElement =>
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
          (): boolean =>
            propAnchorFrame({
              target: {
                kind: "surface",
                environment: "house",
                surface: "floor",
              },
              environments: [
                {
                  ...environment,
                  surfaces: environment.surfaces.map(
                    (entry: IAutoMovieBuiltSurface): IAutoMovieBuiltSurface =>
                      entry.surface.id === "floor"
                        ? {
                            ...entry,
                            surface: { ...entry.surface, polygon: [] },
                          }
                        : entry,
                  ),
                },
              ],
            }) === null,
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );
}
