import type {
  IAutoMovieBuiltSurface,
  IAutoMoviePropBox,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMoviePropSupportFace } from "../../../../packages/engine/src/film/IAutoMoviePropSupportFace";
import { propSupportFace } from "../../../../packages/engine/src/film/propSupportFace";
import { propSupportGap } from "../../../../packages/engine/src/film/propSupportGap";
import { surfaceHeightAt } from "../../../../packages/engine/src/space/surfaceHeightAt";
import type { IFilmPropUtilityInputs } from "./IFilmPropUtilityInputs";
import { IDENTITY_TRANSFORM, createModel } from "./fixtures";
import { namedFacts, nclose } from "./predicates";
import { propRegistry, propSet } from "./propPlacementFixtures";

/**
 * Run the original support surface and bearing assertions without changing their order or inputs.
 *
 * Behavior: Executes the original support-face/height/gap queries and requires the authored face data, signed bearing, scaled/tilted heights and null unmeasurable contacts.
 * Expectation basis: The literal planar surfaces, authored table height, affine scale/tilt and signed underside difference provide expectations independently of a saved query result.
 * Cases: Keeps missing/empty/edge-on supports, positive/negative/zero gaps, the highest ramp probe and both directions of smaller/larger/off-centre support contact.
 * Execution: The existing owning entries call assertFilmPropSupportFaces during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function assertFilmPropSupportFaces(
  input: IFilmPropUtilityInputs,
): void {
  const {
    environment,
    box,
    UNIT,
    tableTop,
    bearing,
    tipped,
    patch,
  }: IFilmPropUtilityInputs = input;
  TestValidator.predicate(
    "a support states one face, and a footprint bears on it or does not",
    Object.values(
      namedFacts([
        [
          "aPatchIsItsOwnPolygonAndHeight",
          (): boolean => {
            const face: IAutoMoviePropSupportFace | null = propSupportFace({
              target: {
                kind: "surface",
                environment: "house",
                surface: "floor",
              },
              environments: [environment],
            });
            return (
              face !== null &&
              face.polygon.outer.points.length === 4 &&
              face.polygon.holes.length === 0 &&
              nclose(surfaceHeightAt(face.height, 3, -2), 0, 0)
            );
          },
        ],
        [
          "aRuledPatchAnswersFromItsRule",
          (): boolean => {
            const face: IAutoMoviePropSupportFace | null = propSupportFace({
              target: {
                kind: "surface",
                environment: "house",
                surface: "annex-floor",
              },
              environments: [environment],
            });
            return (
              face !== null &&
              nclose(surfaceHeightAt(face.height, 7, 1), 0.5, 0)
            );
          },
        ],
        [
          "aHostTopStandsAtTheHostsOwnTop",
          (): boolean => {
            const face: IAutoMoviePropSupportFace | null = tableTop();
            return (
              face !== null &&
              nclose(surfaceHeightAt(face.height, 0, 0), 0.6, 0) &&
              exactGap(
                propSupportGap({
                  face,
                  bounds: box(-0.1, 0.6, -0.1, 0.1, 1, 0.1),
                }),
                0,
              )
            );
          },
        ],
        [
          "aHostTopTravelsWithTheHostsScale",
          (): boolean => {
            const face: IAutoMoviePropSupportFace | null = tableTop({
              ...propSet()[0]!,
              scale: 2,
            });
            return (
              face !== null &&
              nclose(surfaceHeightAt(face.height, 0, 0), 0.9) &&
              bearing(
                propSupportGap({
                  face,
                  bounds: box(0.8, 0.9, -0.1, 0.95, 1.2, 0.1),
                }),
                0,
              ) &&
              propSupportGap({
                face,
                bounds: box(1.4, 0.9, -0.1, 1.6, 1.2, 0.1),
              }) === null
            );
          },
        ],
        [
          "aTiltedTopIsReadAsThePlaneItIs",
          (): boolean => {
            const face: IAutoMoviePropSupportFace | null = tableTop({
              ...propSet()[0]!,
              rotation: tipped(45),
            });
            const drop: number = 0.3 * Math.SQRT1_2;
            return (
              face !== null &&
              nclose(surfaceHeightAt(face.height, 0, drop), 0.3 + drop) &&
              nclose(
                surfaceHeightAt(face.height, 0, 0) -
                  surfaceHeightAt(face.height, 0, 1),
                1,
              ) &&
              nclose(
                surfaceHeightAt(face.height, 1, 0),
                surfaceHeightAt(face.height, -1, 0),
              )
            );
          },
        ],
        [
          "anEdgeOnTopStatesNoFace",
          (): boolean =>
            tableTop({ ...propSet()[0]!, rotation: tipped(90) }) === null,
        ],
        [
          "aStackTopWithoutAnExtentStatesNoFace",
          (): boolean =>
            propSupportFace({
              target: {
                kind: "prop-affordance",
                prop: "shelf",
                affordance: "top",
              },
              environments: [],
              props: [
                {
                  node: "shelf",
                  model: {
                    ...createModel(null),
                    id: "shelf",
                    affordances: [
                      {
                        id: "top",
                        kind: "stack-top",
                        frame: IDENTITY_TRANSFORM,
                        extent: null,
                      },
                    ],
                  },
                  articulation: null,
                },
              ],
              set: [{ node: "shelf", model: "shelf", position: UNIT.position }],
            }) === null,
        ],
        [
          "anEmptyPatchPolygonStatesNoFace",
          (): boolean =>
            propSupportFace({
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
        [
          "everyDanglingSupportCitationStatesNoFace",
          (): boolean =>
            (
              [
                { kind: "surface", environment: "elsewhere", surface: "floor" },
                { kind: "surface", environment: "house", surface: "missing" },
                { kind: "prop-affordance", prop: "missing", affordance: "top" },
                {
                  kind: "prop-affordance",
                  prop: "table",
                  affordance: "missing",
                },
                { kind: "prop-affordance", prop: "table", affordance: "plug" },
              ] as const
            ).every(
              (
                target:
                  | {
                      readonly kind: "surface";
                      readonly environment: "elsewhere";
                      readonly surface: "floor";
                    }
                  | {
                      readonly kind: "surface";
                      readonly environment: "house";
                      readonly surface: "missing";
                    }
                  | {
                      readonly kind: "prop-affordance";
                      readonly prop: "missing";
                      readonly affordance: "top";
                    }
                  | {
                      readonly kind: "prop-affordance";
                      readonly prop: "table";
                      readonly affordance: "missing";
                    }
                  | {
                      readonly kind: "prop-affordance";
                      readonly prop: "table";
                      readonly affordance: "plug";
                    },
              ): boolean =>
                propSupportFace({
                  target,
                  environments: [environment],
                  props: propRegistry(),
                  set: propSet(),
                }) === null,
            ),
        ],
        [
          "anUnstagedOrUnregisteredHostStatesNoFace",
          (): boolean =>
            propSupportFace({
              target: {
                kind: "prop-affordance",
                prop: "table",
                affordance: "top",
              },
              environments: [],
              props: propRegistry(),
            }) === null &&
            propSupportFace({
              target: {
                kind: "prop-affordance",
                prop: "table",
                affordance: "top",
              },
              environments: [],
              set: propSet(),
            }) === null,
        ],
        [
          "restingIsExactlyZero",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 2, originHeight: 0 }),
                bounds: box(-1, 0, -1, 1, 2, 1),
              }),
              0,
            ),
        ],
        [
          "floatingIsPositive",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 2, originHeight: 0 }),
                bounds: box(-1, 0.25, -1, 1, 2, 1),
              }),
              0.25,
            ),
        ],
        [
          "sinkingIsNegative",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 2, originHeight: 0 }),
                bounds: box(-1, -0.25, -1, 1, 2, 1),
              }),
              -0.25,
            ),
        ],
        [
          "standingOffTheFaceIsNull",
          (): boolean =>
            propSupportGap({
              face: patch({ half: 2, originHeight: 0 }),
              bounds: box(5, 0, -1, 6, 2, 1),
            }) === null,
        ],
        [
          "aRampBearsAtItsHighestProbe",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 2, originHeight: 0, slopeZ: 1 }),
                bounds: box(-1, 1, -1, 1, 2, 1),
              }),
              0,
            ) &&
            exactGap(
              propSupportGap({
                face: patch({ half: 2, originHeight: 0, slopeZ: 1 }),
                bounds: box(-1, 0.5, -1, 1, 2, 1),
              }),
              -0.5,
            ),
        ],
        [
          "aFaceSmallerThanTheFootprintIsFoundByItsCentre",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 0.1, originHeight: 0 }),
                bounds: box(-1, 0, -1, 1, 2, 1),
              }),
              0,
            ),
        ],
        [
          "aFaceOffTheFootprintsCentreIsFoundByItsOwnCorners",
          (): boolean =>
            exactGap(
              propSupportGap({
                face: patch({ half: 0.1, originHeight: 0, atX: 0.3 }),
                bounds: box(-3, 0, -0.5, 3, 2, 0.5),
              }),
              0,
            ),
        ],
        [
          "aFaceBesideTheFootprintOnEitherSideIsStillNull",
          (): boolean =>
            (
              [
                box(-1, 0, 0.5, 1, 2, 1.5),
                box(-1, 0, -1.5, 1, 2, -0.5),
              ] as const
            ).every(
              (bounds: IAutoMoviePropBox): boolean =>
                propSupportGap({
                  face: patch({ half: 0.1, originHeight: 0 }),
                  bounds,
                }) === null,
            ),
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );
}

/** Preserve the original exact signed-gap expectation, refusing null without introducing a tolerance. */
function exactGap(actual: number | null, expected: number): boolean {
  return actual !== null && nclose(actual, expected, 0);
}
