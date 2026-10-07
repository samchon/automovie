import { builtEnvironmentSpaceFidelity, footprintContains, footprintConvexPieces, footprintRing, footprintRingPlacement, measureAutoMovieQuantities, propSupportFace, propSupportGap, surfaceFootprint, surfaceHeightAt, tessellateSurface, validateSpace } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { IFootprintVoidGeometryProps } from "./IFootprintVoidGeometryProps";
import { namedFacts, nclose } from "./predicates";

/** Existing emitted-footprint, degeneracy and downstream-consumer checks on the unchanged source fixtures. */
export const assertFootprintVoidGeometry = (props: IFootprintVoidGeometryProps): void => {
  const { holed, holedSpace, plate, ell, diamond, relief, v, gallery, spaceOf, pieceArea } = props;
  const drawn = tessellateSurface(plate)!;
  TestValidator.equals(
    "the drawn plate has the void open, exactly where the query says it is",
    namedFacts([
      ["itDrewSomething", () => drawn.indices.length >= 3],
      [
        "noVertexFallsInsideTheVoid",
        () =>
          Array.from(
            { length: drawn.positions.length / 3 },
            (_, index) =>
              footprintRingPlacement(
                holed.holes[0]!,
                drawn.positions[index * 3]!,
                drawn.positions[index * 3 + 2]!,
              ) !== "inside",
          ).every(Boolean),
      ],
      [
        "everyTriangleCentroidIsOnTheSlab",
        () => {
          for (let face = 0; face < drawn.indices.length; face += 3) {
            let x = 0;
            let z = 0;
            for (let corner = 0; corner < 3; ++corner) {
              const at = drawn.indices[face + corner]! * 3;
              x += drawn.positions[at]! / 3;
              z += drawn.positions[at + 2]! / 3;
            }
            if (footprintContains(holed, x, z) === false) return false;
          }
          return true;
        },
      ],
    ]),
    {
      itDrewSomething: true,
      noVertexFallsInsideTheVoid: true,
      everyTriangleCentroidIsOnTheSlab: true,
    },
  );

  TestValidator.equals(
    "rings with no area hold nothing, and the holed plate validates",
    namedFacts([
      [
        "collinearHoldsNothing",
        () =>
          footprintContains(
            { outer: footprintRing([v(0, 0), v(1, 1), v(2, 2)]), holes: [] },
            1,
            1,
          ) === false,
      ],
      [
        "twoPointsHoldNothing",
        () =>
          footprintRingPlacement(footprintRing([v(0, 0), v(1, 0)]), 0.5, 0) ===
          "outside",
      ],
      [
        "noPiecesFromNoArea",
        () =>
          footprintConvexPieces({
            outer: footprintRing([v(0, 0), v(1, 1), v(2, 2)]),
            holes: [],
          }).length === 0,
      ],
      [
        "nothingIsDrawnForNoArea",
        () =>
          tessellateSurface({
            ...plate,
            polygon: [v(0, 0), v(1, 1), v(2, 2)],
          }) === null,
      ],
      [
        "theHoledPlateValidates",
        () => validateSpace({ space: holedSpace }).success,
      ],
    ]),
    {
      collinearHoldsNothing: true,
      twoPointsHoldNothing: true,
      noPiecesFromNoArea: true,
      nothingIsDrawnForNoArea: true,
      theHoledPlateValidates: true,
    },
  );

  const diamondPieces = footprintConvexPieces(surfaceFootprint(diamond));
  TestValidator.equals(
    "a band that closes to a point is the triangle it is",
    namedFacts([
      [
        "piecesSumToTheDiamondLessItsVoid",
        () =>
          nclose(
            diamondPieces.reduce((sum, piece) => sum + pieceArea(piece), 0),
            32 - 4,
          ),
      ],
      [
        "someBandClosedAtItsWestEnd",
        () =>
          diamondPieces.some(
            (piece) =>
              piece.length === 3 &&
              piece.filter((point) => nclose(point.x, 0)).length === 1,
          ),
      ],
      [
        "someBandClosedAtItsEastEnd",
        () =>
          diamondPieces.some(
            (piece) =>
              piece.length === 3 &&
              piece.filter((point) => nclose(point.x, 8)).length === 1,
          ),
      ],
      [
        "everyPieceStandsOnTheDiamond",
        () =>
          diamondPieces.every((piece) =>
            footprintContains(
              surfaceFootprint(diamond),
              piece.reduce((sum, point) => sum + point.x, 0) / piece.length,
              piece.reduce((sum, point) => sum + point.z, 0) / piece.length,
            ),
          ),
      ],
    ]),
    {
      piecesSumToTheDiamondLessItsVoid: true,
      someBandClosedAtItsWestEnd: true,
      someBandClosedAtItsEastEnd: true,
      everyPieceStandsOnTheDiamond: true,
    },
  );

  const relieved = tessellateSurface(relief)!;
  TestValidator.equals(
    "relief over a holed plate keeps both the lattice and the void",
    namedFacts([
      [
        "everyVertexReadsTheEnginesOwnHeight",
        () =>
          Array.from({ length: relieved.positions.length / 3 }, (_, index) =>
            nclose(
              relieved.positions[index * 3 + 1]!,
              surfaceHeightAt(
                relief,
                relieved.positions[index * 3]!,
                relieved.positions[index * 3 + 2]!,
              ),
              1e-12,
            ),
          ).every(Boolean),
      ],
      [
        "theLatticeSplitTheFootprint",
        () => relieved.indices.length > drawn.indices.length,
      ],
      [
        "noVertexFallsInsideTheVoid",
        () =>
          Array.from(
            { length: relieved.positions.length / 3 },
            (_, index) =>
              footprintRingPlacement(
                holed.holes[0]!,
                relieved.positions[index * 3]!,
                relieved.positions[index * 3 + 2]!,
              ) !== "inside",
          ).every(Boolean),
      ],
    ]),
    {
      everyVertexReadsTheEnginesOwnHeight: true,
      theLatticeSplitTheFootprint: true,
      noVertexFallsInsideTheVoid: true,
    },
  );

  const environment = gallery();
  const face = propSupportFace({
    target: { kind: "surface", environment: "gallery", surface: "plate" },
    environments: [environment],
  })!;
  const crate = (x: number, z: number) => ({
    min: { x: x - 0.5, y: 3, z: z - 0.5 },
    max: { x: x + 0.5, y: 4, z: z + 0.5 },
  });
  TestValidator.equals(
    "what reads the patch reads its void too",
    namedFacts([
      ["theFaceCarriesTheVoid", () => face.polygon.holes.length === 1],
      [
        "aCrateOverAnArmBears",
        () => propSupportGap({ face, bounds: crate(1, 4) }) === 0,
      ],
      [
        "aCrateOverTheAtriumBearsOnNothing",
        () => propSupportGap({ face, bounds: crate(4, 4) }) === null,
      ],
      [
        "aPatchWithNoAreaIsNoFace",
        () =>
          propSupportFace({
            target: {
              kind: "surface",
              environment: "gallery",
              surface: "plate",
            },
            environments: [
              {
                ...environment,
                surfaces: [
                  {
                    space: "hall",
                    surface: { ...plate, polygon: [v(0, 0), v(1, 1), v(2, 2)] },
                  },
                ],
              },
            ],
          }) === null,
      ],
      [
        "theTakeOffSubtractsTheVoid",
        () =>
          nclose(
            measureAutoMovieQuantities({ environment }).findings.find(
              (entry) => entry.subject === "space-floor-area",
            )!.total,
            48,
            1e-6,
          ),
      ],
      [
        "aPatchIsNotAVolume",
        () => builtEnvironmentSpaceFidelity(environment, "hall") === "unstated",
      ],
    ]),
    {
      theFaceCarriesTheVoid: true,
      aCrateOverAnArmBears: true,
      aCrateOverTheAtriumBearsOnNothing: true,
      aPatchWithNoAreaIsNoFace: true,
      theTakeOffSubtractsTheVoid: true,
      aPatchIsNotAVolume: true,
    },
  );

  const skewed = surfaceFootprint({
    ...ell,
    polygon: [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2 + 1e-10, 4), v(0, 4)],
  });
  const skewedPieces = footprintConvexPieces(skewed);
  TestValidator.equals(
    "a band thinner than the tolerance is skipped, not slivered",
    namedFacts([
      [
        "itStillSumsToTheRegion",
        () =>
          nclose(
            skewedPieces.reduce((sum, piece) => sum + pieceArea(piece), 0),
            12,
            1e-6,
          ),
      ],
      [
        "noPieceIsASliver",
        () =>
          skewedPieces.every(
            (piece) =>
              Math.max(...piece.map((point) => point.x)) -
                Math.min(...piece.map((point) => point.x)) >
              1e-9,
          ),
      ],
      ["theNotchIsStillOut", () => footprintContains(skewed, 3, 3) === false],
    ]),
    {
      itStillSumsToTheRegion: true,
      noPieceIsASliver: true,
      theNotchIsStillOut: true,
    },
  );

  const crossing = { ...ell, polygon: [v(0, 0), v(4, 4), v(4, 0), v(0, 6)] };
  const bowtie = surfaceFootprint(crossing);
  TestValidator.equals(
    "a ring that crosses itself is refused, not resolved",
    namedFacts([
      [
        "validationRefusesIt",
        () => validateSpace({ space: spaceOf(crossing) }).success === false,
      ],
      [
        "theDecompositionStaysFinite",
        () =>
          footprintConvexPieces(bowtie).every((piece) =>
            piece.every(
              (point) =>
                Number.isFinite(point.x) &&
                Number.isFinite(point.z) &&
                Number.isFinite(point.y),
            ),
          ),
      ],
      [
        "andContainmentStaysABoolean",
        () => typeof footprintContains(bowtie, 2, 2) === "boolean",
      ],
    ]),
    {
      validationRefusesIt: true,
      theDecompositionStaysFinite: true,
      andContainmentStaysABoolean: true,
    },
  );
};
