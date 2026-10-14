import {
  buildAutoMoviePolyhedron,
  buildAutoMovieWall,
  extrudeAutoMovieProfile,
  extrudeAutoMovieRegion,
  loftAutoMovieSections,
  revolveAutoMovieProfile,
  sweepAutoMovieProfile,
  tessellateToMesh,
} from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The largest value either axis of a mesh's atlas reaches.
 */
const span: (mesh: IAutoMovieMesh, axis: 0 | 1) => number = (
  mesh: IAutoMovieMesh,
  axis: 0 | 1,
): number => {
  let widest: number = Number.NEGATIVE_INFINITY;
  for (let at: number = axis; at < mesh.uvs!.length; at += 2)
    widest = Math.max(widest, mesh.uvs![at]!);
  return widest;
};

const square: (half: number) => Array<{ x: number; y: number }> = (
  half: number,
): Array<{ x: number; y: number }> => [
  { x: -half, y: -half },
  { x: half, y: -half },
  { x: half, y: half },
  { x: -half, y: half },
];

/**
 * Geometry constructors preserve explicit UV absence or their authored metric atlas spans and developed perimeter seam.
 *
 * Scenarios:
 * 1. Region extrusion, loft, revolution and polyhedron emit one UV pair per vertex.
 * 2. Convex extrusion, sweep, wall and primitive tessellation emit null UVs.
 * 3. Authored face length, ring perimeter, loft length and revolution circumference yield spans 3, 8, 3 and 6*pi metres.
 * 4. Metric spans differ from a normalized one-unit box, and the developed ring explicitly opens at zero and closes at eight.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the geometry constructors and measures emitted UV inventory, metric spans and the developed region seam; normalized or missing coordinates on an atlas-bearing constructor fail.
 * @evidence contracts/testing.md#independent-expectations The authored face length, rectangle perimeter, loft path and revolution circumference determine spans 3, 8, 3 and 6*pi metres independently of emitted UVs.
 * @evidence contracts/testing.md#distinguishing-cases Four atlas-bearing constructors contrast with four constructors returning null UVs, metric spans contrast with one-unit normalization, and the perimeter seam contrasts zero with eight; binding vocabulary and visual texture sampling are outside this producer-output unit.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_uv_coordinate_source entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_uv_coordinate_source(): void {
  const face: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  ]);
  const region: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 0, y: 1 },
    ],
    depth: 0.2,
  });
  const lofted: IAutoMovieMesh = loftAutoMovieSections({
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 3 },
    ],
    sections: [
      { at: 0, outer: square(0.5) },
      { at: 1, outer: square(0.5) },
    ],
  });
  const turned: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
    ],
    segments: 8,
  });

  TestValidator.predicate(
    "every atlas-bearing constructor emits one uv pair per vertex",
    test12ValuesClose(
      namedFacts([
        [
          "face",
          (): boolean => face.uvs!.length === (face.positions.length / 3) * 2,
        ],
        [
          "region",
          (): boolean =>
            region.uvs!.length === (region.positions.length / 3) * 2,
        ],
        [
          "lofted",
          (): boolean =>
            lofted.uvs!.length === (lofted.positions.length / 3) * 2,
        ],
        [
          "turned",
          (): boolean =>
            turned.uvs!.length === (turned.positions.length / 3) * 2,
        ],
      ]),
      { face: true, region: true, lofted: true, turned: true },
    ),
  );

  TestValidator.predicate(
    "the constructors that emit none say so, and each names a replacement",
    test12ValuesClose(
      {
        convexExtrusion: extrudeAutoMovieProfile({
          profile: square(0.5),
          depth: 1,
        }).uvs,
        sweep: sweepAutoMovieProfile({
          profile: square(0.5),
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
          ],
        }).uvs,
        wall: buildAutoMovieWall({
          width: 1,
          height: 1,
          depth: 0.1,
          openings: [],
        }).uvs,
        primitive: tessellateToMesh({
          type: "box",
          width: 1,
          height: 1,
          depth: 1,
        }).uvs,
      },
      { convexExtrusion: null, sweep: null, wall: null, primitive: null },
    ),
  );

  TestValidator.predicate(
    "every emitting frame reports the surface's own real dimension in metres",
    test12ValuesClose(
      namedFacts([
        ["face", (): boolean => nclose(span(face, 0), 3)],
        // The reveal runs the outer ring, whose perimeter is 3 + 1 + 3 + 1.
        ["region", (): boolean => nclose(span(region, 0), 8)],
        ["lofted", (): boolean => nclose(span(lofted, 1), 3)],
        ["turned", (): boolean => nclose(span(turned, 0), 2 * Math.PI * 3)],
      ]),
      { face: true, region: true, lofted: true, turned: true },
    ),
  );

  TestValidator.predicate(
    "and none of them is a normalized box that would read one unit instead",
    test12ValuesClose(
      namedFacts([
        ["face", (): boolean => nclose(span(face, 0), 1) === false],
        ["region", (): boolean => nclose(span(region, 0), 1) === false],
        ["lofted", (): boolean => nclose(span(lofted, 1), 1) === false],
        ["turned", (): boolean => nclose(span(turned, 0), 1) === false],
      ]),
      { face: true, region: true, lofted: true, turned: true },
    ),
  );

  // Four cap vertices per side precede four side quads. The first side begins
  // at vertex 8 and the last side ends at vertex 23.
  TestValidator.predicate(
    "the region ring states its perimeter seam as a zero-to-eight-metre cut",
    test12ValuesClose(
      namedFacts([
        ["opensAtZero", (): boolean => nclose(region.uvs![8 * 2]!, 0)],
        ["closesAtPerimeter", (): boolean => nclose(region.uvs![23 * 2]!, 8)],
        [
          "doesNotHideTheCut",
          (): boolean =>
            nclose(region.uvs![8 * 2]!, region.uvs![23 * 2]!) === false,
        ],
      ]),
      { opensAtZero: true, closesAtPerimeter: true, doesNotHideTheCut: true },
    ),
  );
}
