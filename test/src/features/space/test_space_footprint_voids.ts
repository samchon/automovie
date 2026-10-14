import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { autoMoviePlanarRegionFailure, IAutoMovieFootprint, footprintArea, footprintContains, footprintConvexPieces, footprintInteriorPoint, footprintRing, footprintRingPlacement, heightAt, isWalkable, spaceGround, supportContactsFor, surfaceContains, surfaceFootprint } from "@automovie/engine";













import { assertFootprintVoidGeometry } from "../internal/assertFootprintVoidGeometry";
import { createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const v: (
  x: number,
  z: number,
  y?: number,
) => { x: number; y: number; z: number } = (
  x: number,
  z: number,
  y: number = 0,
): { x: number; y: number; z: number } => ({ x, y, z });

/** An 8x8 floor plate with a 4x4 atrium void cut through the middle of it. */
const plate: IAutoMovieSurface = {
  id: "plate",
  kind: "floor",
  polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
  holes: [[v(2, 2), v(6, 2), v(6, 6), v(2, 6)]],
  anchor: { x: 0, y: 3, z: 0 },
  rampTo: null,
};

/** The same plate without the void, as the shape the hull query used to see. */
const solid: IAutoMovieSurface = {
  id: "plate",
  kind: "floor",
  polygon: plate.polygon,
  anchor: plate.anchor,
  rampTo: null,
};

/** An L-shaped plate: the notch is the quadrant x>2, z>2. */
const ell: IAutoMovieSurface = {
  id: "ell",
  kind: "floor",
  polygon: [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2, 4), v(0, 4)],
  anchor: { x: 0, y: 1, z: 0 },
  rampTo: null,
};

/**
 * A diamond plate with a square void, whose slabs are trapezoids that close to
 * a point at the west apex of one band and the east apex of another.
 */
const diamond: IAutoMovieSurface = {
  id: "diamond",
  kind: "floor",
  polygon: [v(0, 4), v(4, 0), v(8, 4), v(4, 8)],
  holes: [[v(3, 3), v(5, 3), v(5, 5), v(3, 5)]],
  anchor: { x: 0, y: 0, z: 0 },
  rampTo: null,
};

/** The holed plate again, stating its ground as a lattice instead of anchors. */
const relief: IAutoMovieSurface = {
  id: "relief",
  kind: "floor",
  polygon: plate.polygon,
  holes: plate.holes,
  height: {
    kind: "heightfield",
    originX: 0,
    originZ: 0,
    spacingX: 4,
    spacingZ: 4,
    columns: 3,
    rows: 3,
    samples: [0, 1, 0, 1, 2, 1, 0, 1, 0],
  },
};

/** A one-room building whose only support patch is the holed plate. */
const gallery: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "gallery",
    units: "meter",
    buildings: [{ id: "block", element: "root", space: "hall" }],
    models: [{ ...createModel(null), id: "stone" }],
    modelReferences: [],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: "stone",
        space: "hall",
      },
    ],
    spaces: [{ id: "hall", kind: "room", parent: null, cells: [] }],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [{ space: "hall", surface: plate }],
    walkable: [plate.id],
  });

const spaceOf: (surface: IAutoMovieSurface) => IAutoMovieSpace = (
  surface: IAutoMovieSurface,
): IAutoMovieSpace => ({
  id: "set",
  surfaces: [surface],
  walkable: [surface.id],
});

/** Plan area of one convex piece, by the shoelace formula. */
const pieceArea: (piece: readonly IAutoMovieVector3[]) => number = (
  piece: readonly IAutoMovieVector3[],
): number =>
  Math.abs(
    footprintRing(
      piece.map((p: IAutoMovieVector3): { x: number; y: number; z: number } =>
        v(p.x, p.z),
      ),
    ).doubleArea,
  ) / 2;

/**
 * A support patch is the region its own rings describe, notch and void
 * included.
 *
 * Until #1868 the ground query classified a plan point against
 * `convexHull2D(polygon)`, so the only shapes it could tell the truth about
 * were convex ones — and `validateSpace` refused the rest, correctly, because a
 * hull fills an L-shaped plate's notch and floors a slab's atrium without ever
 * saying so. This case pins the inverse from the query side: the rings are read
 * as authored, a point over the void is off the surface everywhere that fact is
 * consumed, and a convex patch answers exactly what it always did.
 *
 * Scenarios:
 *
 * 1. A holed plate is one surface. A point inside the void is outside the
 *    footprint; points in each of the four arms around it are inside; a point
 *    beyond the outer ring is outside.
 * 2. The region is closed at both rims: a point exactly on the void's own rim is
 *    on the slab (the concrete reaches its own edge), and so is a point on the
 *    outer rim.
 * 3. Regression: over the same plate without the void, every one of those probes
 *    answers what the convex query answered — the void is the only difference
 *    the change makes.
 * 4. An L-shaped plate's notch is outside while both arms are inside; the notch
 *    probe is the exact point the old refusal existed to prevent.
 * 5. The void is off the surface in every query built on containment, not only the
 *    predicate: `heightAt`, `isWalkable`, `supportContactsFor` and
 *    `spaceGround`'s fallback all read it as nothing.
 * 6. Plan area is the outer ring less its holes: a donut is 64 - 16 = 48 m².
 * 7. The convex decomposition covers exactly the region: its pieces sum to the
 *    footprint's own area, and a solid convex patch decomposes to one piece.
 * 8. An interior anchor lands on the region, not in the notch a vertex mean would
 *    fall into.
 * 9. The drawn surface is the queried surface: no tessellated vertex of the holed
 *    plate falls strictly inside the void.
 * 10. Degenerate and negative twins: a collinear ring holds nothing, a ring of two
 *     points holds nothing, and the validator accepts the holed plate the
 *     queries just answered for.
 * 11. A slab band that closes to a point at either end is emitted as the triangle
 *     it is: a diamond plate with a void has one at its west apex and one at
 *     its east, and the decomposition still sums to the plate's own area.
 * 12. Relief over a holed plate: every drawn vertex reads `surfaceHeightAt` at its
 *     own plan position and none of them falls in the void, so the lattice path
 *     and the void agree rather than one of them winning.
 * 13. The void is honoured by what reads the patch, not only by the patch: a prop
 *     over the atrium bears on nothing while the same prop over an arm bears on
 *     the slab, a patch with no area is no face at all, and the take-off
 *     subtracts the void from the floor area somebody orders against.
 * 14. An admitted positive thin band survives decomposition. An independently
 *     specified dyadic L has normalized area three in its authored winding, so a hull
 *     replacement or dropped band cannot hide behind a broad absolute tolerance.
 * 15. Validation refuses a crossing ring; its decomposition contains only finite points and its containment query returns a boolean. These assertions do not require an empty decomposition or compare repeated readings.
 *
 * @evidence contracts/testing.md#behavioral-verification Footprint membership, support/ground outputs, convex-piece area and emitted surface triangles exercise actual region readers and consumers; the dyadic thin L catches both hull-filled notches and dropped positive slabs.
 * @evidence contracts/testing.md#independent-expectations Authored rectangles give plate area 64-16=48 and thin L area three times its binary-exact width. Shoelace sums check the actual decomposition, while downstream membership and emitted triangle probes establish the asserted local void cases rather than universal polygon exactness.
 * @evidence contracts/testing.md#distinguishing-cases Holed and filled plates, concave L, both rims, ordinary convex input, zero-area and crossing rings, point-closing slabs, relief and supported/unsupported props preserve the existing cases; the admitted thin L and narrow band distinguish feature preservation from the separate containment rim tolerance.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_space_footprint_voids; this export owns its assertions and invokes assertFootprintVoidGeometry for the existing geometric/consumer cases. It neither installs a viewer nor proves GPU appearance or another OS.
 */
export function test_space_footprint_voids(): void {
  // An admitted dyadic L is three width-by-one rectangles. Normalize its area
  // by width so a broad absolute tolerance cannot hide the positive feature.
  const width: number = 2 ** -32;
  const thin: IAutoMovieFootprint = surfaceFootprint({
    ...ell,
    polygon: [
      v(0, 0),
      v(width, 0),
      v(width, 1),
      v(2 * width, 1),
      v(2 * width, 2),
      v(0, 2),
    ],
  });
  TestValidator.equals(
    "thin positive L is admitted by canonical region hygiene",
    autoMoviePlanarRegionFailure({ outer: thin.outer.plan }),
    null,
  );
  const thinArea: number = footprintConvexPieces(thin).reduce(
    (sum: number, piece: readonly IAutoMovieVector3[]): number =>
      sum + pieceArea(piece),
    0,
  );
  TestValidator.predicate(
    `convex pieces preserve the independently authored thin L area: measured ${thinArea / width}, expected 3`,
    nclose(thinArea / width, 3, 1e-12),
  );
  const holed: IAutoMovieFootprint = surfaceFootprint(plate);
  const filled: IAutoMovieFootprint = surfaceFootprint(solid);

  TestValidator.equals(
    "a void in a plate is off the surface while its arms are on it",
    namedFacts([
      ["inTheVoid", (): boolean => surfaceContains(plate, 4, 4) === false],
      ["southArm", (): boolean => surfaceContains(plate, 4, 1)],
      ["northArm", (): boolean => surfaceContains(plate, 4, 7)],
      ["westArm", (): boolean => surfaceContains(plate, 1, 4)],
      ["eastArm", (): boolean => surfaceContains(plate, 7, 4)],
      ["beyondThePlate", (): boolean => surfaceContains(plate, 9, 4) === false],
      ["voidCorner", (): boolean => surfaceContains(plate, 5.9, 5.9) === false],
    ]),
    {
      inTheVoid: true,
      southArm: true,
      northArm: true,
      westArm: true,
      eastArm: true,
      beyondThePlate: true,
      voidCorner: true,
    },
  );

  TestValidator.equals(
    "both rims belong to the slab, because the concrete reaches them",
    namedFacts([
      ["onTheVoidRim", (): boolean => surfaceContains(plate, 2, 4)],
      ["onTheVoidCorner", (): boolean => surfaceContains(plate, 6, 6)],
      ["onTheOuterRim", (): boolean => surfaceContains(plate, 0, 4)],
      [
        "ringPlacementSaysBoundary",
        (): boolean =>
          footprintRingPlacement(holed.holes[0]!, 2, 4) === "boundary" &&
          footprintRingPlacement(holed.holes[0]!, 4, 4) === "inside" &&
          footprintRingPlacement(holed.holes[0]!, 7, 4) === "outside",
      ],
    ]),
    {
      onTheVoidRim: true,
      onTheVoidCorner: true,
      onTheOuterRim: true,
      ringPlacementSaysBoundary: true,
    },
  );

  TestValidator.equals(
    "without the void the same plate answers what the convex query answered",
    namedFacts([
      ["theVoidsPlace", (): boolean => surfaceContains(solid, 4, 4)],
      ["southArm", (): boolean => surfaceContains(solid, 4, 1)],
      ["northArm", (): boolean => surfaceContains(solid, 4, 7)],
      ["westArm", (): boolean => surfaceContains(solid, 1, 4)],
      ["eastArm", (): boolean => surfaceContains(solid, 7, 4)],
      ["beyondThePlate", (): boolean => surfaceContains(solid, 9, 4) === false],
      ["onTheOuterRim", (): boolean => surfaceContains(solid, 0, 4)],
    ]),
    {
      theVoidsPlace: true,
      southArm: true,
      northArm: true,
      westArm: true,
      eastArm: true,
      beyondThePlate: true,
      onTheOuterRim: true,
    },
  );

  TestValidator.equals(
    "an L-shaped plate keeps its notch out and both arms in",
    namedFacts([
      ["inTheNotch", (): boolean => surfaceContains(ell, 3, 3) === false],
      ["longArm", (): boolean => surfaceContains(ell, 3, 1)],
      ["shortArm", (): boolean => surfaceContains(ell, 1, 3)],
      ["onTheInnerCorner", (): boolean => surfaceContains(ell, 2, 2)],
      ["outside", (): boolean => surfaceContains(ell, 5, 5) === false],
    ]),
    {
      inTheNotch: true,
      longArm: true,
      shortArm: true,
      onTheInnerCorner: true,
      outside: true,
    },
  );

  const holedSpace: IAutoMovieSpace = spaceOf(plate);
  TestValidator.equals(
    "every query built on containment reads the void as nothing",
    namedFacts([
      [
        "heightOverTheArm",
        (): boolean => nclose(heightAt(holedSpace, 4, 1) ?? NaN, 3, 0),
      ],
      ["heightOverTheVoid", (): boolean => heightAt(holedSpace, 4, 4) === null],
      ["walkableOverTheArm", (): boolean => isWalkable(holedSpace, 4, 1)],
      [
        "walkableOverTheVoid",
        (): boolean => isWalkable(holedSpace, 4, 4) === false,
      ],
      [
        "onlyTheArmCornersSupport",
        (): boolean =>
          supportContactsFor(holedSpace, [v(4, 1), v(4, 4), v(4, 7)]).length ===
          2,
      ],
      [
        "groundOverTheArm",
        (): boolean => nclose(spaceGround(holedSpace)(4, 1), 3, 0),
      ],
      [
        "groundOverTheVoid",
        (): boolean => nclose(spaceGround(holedSpace, -1)(4, 4), -1, 0),
      ],
    ]),
    {
      heightOverTheArm: true,
      heightOverTheVoid: true,
      walkableOverTheArm: true,
      walkableOverTheVoid: true,
      onlyTheArmCornersSupport: true,
      groundOverTheArm: true,
      groundOverTheVoid: true,
    },
  );

  TestValidator.equals(
    "the plate's plan area is its outer ring less the void",
    namedFacts([
      ["holed", (): boolean => nclose(footprintArea(holed), 8 * 8 - 4 * 4)],
      ["filled", (): boolean => nclose(footprintArea(filled), 8 * 8)],
    ]),
    { holed: true, filled: true },
  );

  const holedPieces: IAutoMovieVector3[][] = footprintConvexPieces(holed);
  const ellPieces: IAutoMovieVector3[][] = footprintConvexPieces(
    surfaceFootprint(ell),
  );
  TestValidator.equals(
    "the convex decomposition is exactly the region, no more and no less",
    namedFacts([
      [
        "holedPiecesSumToTheHoledArea",
        (): boolean =>
          nclose(
            holedPieces.reduce(
              (sum: number, piece: IAutoMovieVector3[]): number =>
                sum + pieceArea(piece),
              0,
            ),
            48,
          ),
      ],
      [
        "ellPiecesSumToTheEllArea",
        (): boolean =>
          nclose(
            ellPieces.reduce(
              (sum: number, piece: IAutoMovieVector3[]): number =>
                sum + pieceArea(piece),
              0,
            ),
            4 * 2 + 2 * 2,
          ),
      ],
      [
        "noPieceReachesIntoTheVoid",
        (): boolean =>
          holedPieces.every(
            (piece: IAutoMovieVector3[]): boolean =>
              footprintContains(
                holed,
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
              ) === true,
          ),
      ],
      [
        "aConvexPatchIsOnePiece",
        (): boolean => footprintConvexPieces(filled).length === 1,
      ],
    ]),
    {
      holedPiecesSumToTheHoledArea: true,
      ellPiecesSumToTheEllArea: true,
      noPieceReachesIntoTheVoid: true,
      aConvexPatchIsOnePiece: true,
    },
  );

  TestValidator.equals(
    "an interior anchor stands on the patch rather than in its hole",
    namedFacts([
      [
        "holedAnchorIsOnTheSlab",
        (): boolean => {
          const anchor: { x: number; z: number } | null =
            footprintInteriorPoint(holed);
          return (
            anchor !== null && footprintContains(holed, anchor.x, anchor.z)
          );
        },
      ],
      [
        "ellAnchorIsOutOfTheNotch",
        (): boolean => {
          const anchor: { x: number; z: number } | null =
            footprintInteriorPoint(surfaceFootprint(ell));
          return (
            anchor !== null &&
            footprintContains(surfaceFootprint(ell), anchor.x, anchor.z)
          );
        },
      ],
      [
        "aConvexPatchKeepsItsOwnCentre",
        (): boolean => {
          const anchor: { x: number; z: number } | null =
            footprintInteriorPoint(filled);
          return anchor !== null && nclose(anchor.x, 4) && nclose(anchor.z, 4);
        },
      ],
      [
        "aRegionWithNoAreaHasNoAnchor",
        (): boolean =>
          footprintInteriorPoint({
            outer: footprintRing([v(0, 0), v(1, 1), v(2, 2)]),
            holes: [],
          }) === null,
      ],
    ]),
    {
      holedAnchorIsOnTheSlab: true,
      ellAnchorIsOutOfTheNotch: true,
      aConvexPatchKeepsItsOwnCentre: true,
      aRegionWithNoAreaHasNoAnchor: true,
    },
  );

  assertFootprintVoidGeometry({
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
  });
}
