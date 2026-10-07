import { propSupportFace, propSupportGap, surfaceHeightAt } from "@automovie/engine";
import { propRegistry, propSet } from "../film/propPlacementFixtures";
import { namedFacts, nclose } from "./predicates";
import { IDENTITY_TRANSFORM, createModel } from "./fixtures";
import { TestValidator } from "@nestia/e2e";
import type { IFilmPropUtilityInputs } from "./IFilmPropUtilityInputs";

/** Run the original support surface and bearing assertions without changing their order or inputs. */
export function assertFilmPropSupportFaces(input: IFilmPropUtilityInputs): void {
  const { environment, box, UNIT, tableTop, bearing, tipped, patch } = input;
  TestValidator.equals(
    "a support states one face, and a footprint bears on it or does not",
    namedFacts([
      [
        "aPatchIsItsOwnPolygonAndHeight",
        () => {
          const face = propSupportFace({
            target: { kind: "surface", environment: "house", surface: "floor" },
            environments: [environment],
          });
          return (
            face !== null &&
            face.polygon.outer.points.length === 4 &&
            face.polygon.holes.length === 0 &&
            surfaceHeightAt(face.height, 3, -2) === 0
          );
        },
      ],
      [
        "aRuledPatchAnswersFromItsRule",
        () => {
          const face = propSupportFace({
            target: {
              kind: "surface",
              environment: "house",
              surface: "annex-floor",
            },
            environments: [environment],
          });
          return face !== null && surfaceHeightAt(face.height, 7, 1) === 0.5;
        },
      ],
      [
        "aHostTopStandsAtTheHostsOwnTop",
        () => {
          const face = tableTop();
          return (
            face !== null &&
            surfaceHeightAt(face.height, 0, 0) === 0.6 &&
            propSupportGap({
              face,
              bounds: box(-0.1, 0.6, -0.1, 0.1, 1, 0.1),
            }) === 0
          );
        },
      ],
      [
        "aHostTopTravelsWithTheHostsScale",
        () => {
          const face = tableTop({ ...propSet()[0]!, scale: 2 });
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
        () => {
          const face = tableTop({ ...propSet()[0]!, rotation: tipped(45) });
          const drop = 0.3 * Math.SQRT1_2;
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
        () => tableTop({ ...propSet()[0]!, rotation: tipped(90) }) === null,
      ],
      [
        "aStackTopWithoutAnExtentStatesNoFace",
        () =>
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
        () =>
          propSupportFace({
            target: { kind: "surface", environment: "house", surface: "floor" },
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
      [
        "everyDanglingSupportCitationStatesNoFace",
        () =>
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
            (target) =>
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
        () =>
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
        () =>
          propSupportGap({
            face: patch({ half: 2, originHeight: 0 }),
            bounds: box(-1, 0, -1, 1, 2, 1),
          }) === 0,
      ],
      [
        "floatingIsPositive",
        () =>
          propSupportGap({
            face: patch({ half: 2, originHeight: 0 }),
            bounds: box(-1, 0.25, -1, 1, 2, 1),
          }) === 0.25,
      ],
      [
        "sinkingIsNegative",
        () =>
          propSupportGap({
            face: patch({ half: 2, originHeight: 0 }),
            bounds: box(-1, -0.25, -1, 1, 2, 1),
          }) === -0.25,
      ],
      [
        "standingOffTheFaceIsNull",
        () =>
          propSupportGap({
            face: patch({ half: 2, originHeight: 0 }),
            bounds: box(5, 0, -1, 6, 2, 1),
          }) === null,
      ],
      [
        "aRampBearsAtItsHighestProbe",
        () =>
          propSupportGap({
            face: patch({ half: 2, originHeight: 0, slopeZ: 1 }),
            bounds: box(-1, 1, -1, 1, 2, 1),
          }) === 0 &&
          propSupportGap({
            face: patch({ half: 2, originHeight: 0, slopeZ: 1 }),
            bounds: box(-1, 0.5, -1, 1, 2, 1),
          }) === -0.5,
      ],
      [
        "aFaceSmallerThanTheFootprintIsFoundByItsCentre",
        () =>
          propSupportGap({
            face: patch({ half: 0.1, originHeight: 0 }),
            bounds: box(-1, 0, -1, 1, 2, 1),
          }) === 0,
      ],
      [
        "aFaceOffTheFootprintsCentreIsFoundByItsOwnCorners",
        () =>
          propSupportGap({
            face: patch({ half: 0.1, originHeight: 0, atX: 0.3 }),
            bounds: box(-3, 0, -0.5, 3, 2, 0.5),
          }) === 0,
      ],
      [
        "aFaceBesideTheFootprintOnEitherSideIsStillNull",
        () =>
          (
            [box(-1, 0, 0.5, 1, 2, 1.5), box(-1, 0, -1.5, 1, 2, -0.5)] as const
          ).every(
            (bounds) =>
              propSupportGap({
                face: patch({ half: 0.1, originHeight: 0 }),
                bounds,
              }) === null,
          ),
      ],
    ]),
    {
      aPatchIsItsOwnPolygonAndHeight: true,
      aRuledPatchAnswersFromItsRule: true,
      aHostTopStandsAtTheHostsOwnTop: true,
      aHostTopTravelsWithTheHostsScale: true,
      aTiltedTopIsReadAsThePlaneItIs: true,
      anEdgeOnTopStatesNoFace: true,
      aStackTopWithoutAnExtentStatesNoFace: true,
      anEmptyPatchPolygonStatesNoFace: true,
      everyDanglingSupportCitationStatesNoFace: true,
      anUnstagedOrUnregisteredHostStatesNoFace: true,
      restingIsExactlyZero: true,
      floatingIsPositive: true,
      sinkingIsNegative: true,
      standingOffTheFaceIsNull: true,
      aRampBearsAtItsHighestProbe: true,
      aFaceSmallerThanTheFootprintIsFoundByItsCentre: true,
      aFaceOffTheFootprintsCentreIsFoundByItsOwnCorners: true,
      aFaceBesideTheFootprintOnEitherSideIsStillNull: true,
    },
  );

}
