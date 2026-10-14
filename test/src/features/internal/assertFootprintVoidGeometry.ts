import {
  AutoMovieSurfaceKind,
  IAutoMovieBuiltEnvironment,
  IAutoMovieHeightRule,
  IAutoMovieQuantityFinding,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentSpaceFidelity, measureAutoMovieQuantities, IAutoMoviePropSupportFace, propSupportFace, propSupportGap, ITessellation, tessellateSurface, IAutoMovieFootprint, footprintContains, footprintConvexPieces, footprintRing, footprintRingPlacement, surfaceFootprint, surfaceHeightAt, validateSpace } from "@automovie/engine";














import { IFootprintVoidGeometryProps } from "./IFootprintVoidGeometryProps";
import { namedFacts, nclose } from "./predicates";

/** Assert emitted triangles, area, degeneracy, relief, prop support and quantity results for the owning test's authored regions; these are CPU consumer observations rather than rendered appearance. */
export const assertFootprintVoidGeometry: (
  props: IFootprintVoidGeometryProps,
) => void = (props: IFootprintVoidGeometryProps): void => {
  const {
    holed,
    holedSpace,
    plate,
    ell,
    diamond,
    relief,
    v,
    gallery,
    spaceOf,
    pieceArea,
  }: typeof props = props;
  const drawn: ITessellation = tessellateSurface(plate)!;
  TestValidator.equals(
    "the drawn plate has the void open, exactly where the query says it is",
    namedFacts([
      ["itDrewSomething", (): boolean => drawn.indices.length >= 3],
      [
        "noVertexFallsInsideTheVoid",
        (): boolean =>
          Array.from(
            { length: drawn.positions.length / 3 },
            (_: unknown, index: number): boolean =>
              footprintRingPlacement(
                holed.holes[0]!,
                drawn.positions[index * 3]!,
                drawn.positions[index * 3 + 2]!,
              ) !== "inside",
          ).every(Boolean),
      ],
      [
        "everyTriangleCentroidIsOnTheSlab",
        (): boolean => {
          for (let face: number = 0; face < drawn.indices.length; face += 3) {
            let x: number = 0;
            let z: number = 0;
            for (let corner: number = 0; corner < 3; ++corner) {
              const at: number = drawn.indices[face + corner]! * 3;
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
        (): boolean =>
          footprintContains(
            { outer: footprintRing([v(0, 0), v(1, 1), v(2, 2)]), holes: [] },
            1,
            1,
          ) === false,
      ],
      [
        "twoPointsHoldNothing",
        (): boolean =>
          footprintRingPlacement(footprintRing([v(0, 0), v(1, 0)]), 0.5, 0) ===
          "outside",
      ],
      [
        "noPiecesFromNoArea",
        (): boolean =>
          footprintConvexPieces({
            outer: footprintRing([v(0, 0), v(1, 1), v(2, 2)]),
            holes: [],
          }).length === 0,
      ],
      [
        "nothingIsDrawnForNoArea",
        (): boolean =>
          tessellateSurface({
            ...plate,
            polygon: [v(0, 0), v(1, 1), v(2, 2)],
          }) === null,
      ],
      [
        "theHoledPlateValidates",
        (): boolean => validateSpace({ space: holedSpace }).success,
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

  const diamondPieces: IAutoMovieVector3[][] = footprintConvexPieces(
    surfaceFootprint(diamond),
  );
  TestValidator.equals(
    "a band that closes to a point is the triangle it is",
    namedFacts([
      [
        "piecesSumToTheDiamondLessItsVoid",
        (): boolean =>
          nclose(
            diamondPieces.reduce(
              (sum: number, piece: IAutoMovieVector3[]): number =>
                sum + pieceArea(piece),
              0,
            ),
            32 - 4,
          ),
      ],
      [
        "someBandClosedAtItsWestEnd",
        (): boolean =>
          diamondPieces.some(
            (piece: IAutoMovieVector3[]): boolean =>
              piece.length === 3 &&
              piece.filter((point: IAutoMovieVector3): boolean =>
                nclose(point.x, 0),
              ).length === 1,
          ),
      ],
      [
        "someBandClosedAtItsEastEnd",
        (): boolean =>
          diamondPieces.some(
            (piece: IAutoMovieVector3[]): boolean =>
              piece.length === 3 &&
              piece.filter((point: IAutoMovieVector3): boolean =>
                nclose(point.x, 8),
              ).length === 1,
          ),
      ],
      [
        "everyPieceStandsOnTheDiamond",
        (): boolean =>
          diamondPieces.every((piece: IAutoMovieVector3[]): boolean =>
            footprintContains(
              surfaceFootprint(diamond),
              piece.reduce(
                (sum: number, point: IAutoMovieVector3): number =>
                  sum + point.x,
                0,
              ) / piece.length,
              piece.reduce(
                (sum: number, point: IAutoMovieVector3): number =>
                  sum + point.z,
                0,
              ) / piece.length,
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

  const relieved: ITessellation = tessellateSurface(relief)!;
  TestValidator.equals(
    "relief over a holed plate keeps both the lattice and the void",
    namedFacts([
      [
        "everyVertexReadsTheEnginesOwnHeight",
        (): boolean =>
          Array.from(
            { length: relieved.positions.length / 3 },
            (_: unknown, index: number): boolean =>
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
        (): boolean => relieved.indices.length > drawn.indices.length,
      ],
      [
        "noVertexFallsInsideTheVoid",
        (): boolean =>
          Array.from(
            { length: relieved.positions.length / 3 },
            (_: unknown, index: number): boolean =>
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

  const environment: IAutoMovieBuiltEnvironment = gallery();
  const face: IAutoMoviePropSupportFace = propSupportFace({
    target: { kind: "surface", environment: "gallery", surface: "plate" },
    environments: [environment],
  })!;
  const crate: (
    x: number,
    z: number,
  ) => {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } = (
    x: number,
    z: number,
  ): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } => ({
    min: { x: x - 0.5, y: 3, z: z - 0.5 },
    max: { x: x + 0.5, y: 4, z: z + 0.5 },
  });
  TestValidator.equals(
    "what reads the patch reads its void too",
    namedFacts([
      ["theFaceCarriesTheVoid", (): boolean => face.polygon.holes.length === 1],
      [
        "aCrateOverAnArmBears",
        (): boolean =>
          nclose(propSupportGap({ face, bounds: crate(1, 4) }) ?? NaN, 0, 0),
      ],
      [
        "aCrateOverTheAtriumBearsOnNothing",
        (): boolean => propSupportGap({ face, bounds: crate(4, 4) }) === null,
      ],
      [
        "aPatchWithNoAreaIsNoFace",
        (): boolean =>
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
        (): boolean =>
          nclose(
            measureAutoMovieQuantities({ environment }).findings.find(
              (entry: IAutoMovieQuantityFinding): boolean =>
                entry.subject === "space-floor-area",
            )!.total,
            48,
            1e-6,
          ),
      ],
      [
        "aPatchIsNotAVolume",
        (): boolean =>
          builtEnvironmentSpaceFidelity(environment, "hall") === "unstated",
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

  const skewed: IAutoMovieFootprint = surfaceFootprint({
    ...ell,
    polygon: [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2 + 1e-10, 4), v(0, 4)],
  });
  const skewedPieces: IAutoMovieVector3[][] = footprintConvexPieces(skewed);
  TestValidator.equals(
    "an admitted thin band remains part of the exact region",
    namedFacts([
      [
        "itStillSumsToTheRegion",
        (): boolean =>
          nclose(
            skewedPieces.reduce(
              (sum: number, piece: IAutoMovieVector3[]): number =>
                sum + pieceArea(piece),
              0,
            ),
            12 + 1e-10,
            1e-12,
          ),
      ],
      [
        "thePositiveThinBandSurvives",
        (): boolean =>
          skewedPieces.some((piece: IAutoMovieVector3[]): boolean => {
            const width: number =
              Math.max(
                ...piece.map((point: IAutoMovieVector3): number => point.x),
              ) -
              Math.min(
                ...piece.map((point: IAutoMovieVector3): number => point.x),
              );
            return width > 0 && width <= 1e-9 && pieceArea(piece) > 0;
          }),
      ],
      [
        "theNotchIsStillOut",
        (): boolean => footprintContains(skewed, 3, 3) === false,
      ],
    ]),
    {
      itStillSumsToTheRegion: true,
      thePositiveThinBandSurvives: true,
      theNotchIsStillOut: true,
    },
  );

  const crossing: {
    polygon: IAutoMovieVector3[];
    id: string;
    kind: AutoMovieSurfaceKind;
    holes?: IAutoMovieVector3[][] | undefined;
    height?: IAutoMovieHeightRule | undefined;
    anchor?: IAutoMovieVector3 | undefined;
    rampTo?: IAutoMovieVector3 | null | undefined;
  } = { ...ell, polygon: [v(0, 0), v(4, 4), v(4, 0), v(0, 6)] };
  const bowtie: IAutoMovieFootprint = surfaceFootprint(crossing);
  TestValidator.equals(
    "a ring that crosses itself is refused, not resolved",
    namedFacts([
      [
        "validationRefusesIt",
        (): boolean =>
          validateSpace({ space: spaceOf(crossing) }).success === false,
      ],
      [
        "theDecompositionStaysFinite",
        (): boolean =>
          footprintConvexPieces(bowtie).every(
            (piece: IAutoMovieVector3[]): boolean =>
              piece.every(
                (point: IAutoMovieVector3): boolean =>
                  Number.isFinite(point.x) &&
                  Number.isFinite(point.z) &&
                  Number.isFinite(point.y),
              ),
          ),
      ],
      [
        "andContainmentStaysABoolean",
        (): boolean => typeof footprintContains(bowtie, 2, 2) === "boolean",
      ],
    ]),
    {
      validationRefusesIt: true,
      theDecompositionStaysFinite: true,
      andContainmentStaysABoolean: true,
    },
  );
};
