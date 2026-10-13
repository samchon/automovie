import {
  autoMoviePlanarRegionFailure,
  footprintConvexPieces,
  footprintRing,
  triangulateAutoMoviePolygon,
  triangulateAutoMovieRegion,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

const square = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
];
const crossing = [
  { x: 0, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
  { x: 4, y: 0 },
  { x: 2, y: -1 },
];

/**
 *
 * Every planar consumer shares one hygiene decision and keeps its own API law.
 *
 * The region boundary returns a message instead of repaired geometry; the
 * procedural region and the drawing triangulator throw it, and the footprint
 * decomposition answers no pieces rather than inventing a region.
 *
 * Scenarios:
 *
 * 1. A 4 m square less a 1 m square hole triangulates to area 15 over two rings,
 *    and the bare square draws as two triangles.
 * 2. A self-crossing ring is named by the boundary, thrown by both constructors,
 *    and decomposes into no footprint pieces; a valid square whose cached double
 *    area reads zero also yields none.
 * 3. A non-finite coordinate, an adjacent duplicate point, a hole touching the
 *    outer ring and a hole outside it are each refused by their own phrase.
 * 4. A two-point ring, a collinear ring and a spike are refused, a hole inside
 *    another hole is refused, while a redundant straight point and two disjoint
 *    holes are accepted.
 * 5. Drawing keeps its own short-ring diagnostic ahead of the shared boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `triangulateAutoMovieRegion`, `triangulateAutoMoviePolygon`, `autoMoviePlanarRegionFailure` and `footprintConvexPieces` and asserts area, ring and triangle counts, returned failure phrases, thrown errors and piece counts; it catches a hole left in the area, one consumer accepting a self-crossing ring another refuses, a footprint inventing pieces for a ring with no region or ignoring its cached zero area, a refusal firing on a straight redundant point or disjoint holes, and the drawing short-ring message being replaced by the shared one.
 * @evidence contracts/testing.md#independent-expectations Area 15 is 16 m2 of square less 1 m2 of hole, two rings is outer plus one hole, and two triangles is n - 2 for a quadrilateral; each refusal is matched by the phrase the region constructor's doc comment lists for that defect (three points, finite, repeats, no area, doubles back, crosses itself, touch or cross, inside, outside), so the oracle pins which condition fired but not the edge indices or label in the message.
 * @evidence contracts/testing.md#distinguishing-cases Positive holed square and disjoint holes; negative self-crossing, non-finite, duplicate, touching, outside and nested-hole inputs plus short, collinear and spiked rings; the redundant straight point is the adjacent input beside the spike that must stay accepted, and the stale zero area is the degenerate footprint; triangulation coverage, winding and source indices belong to test_geometry_region_triangulation and test_geometry_region_source_identities, and footprint voids to test_space_footprint_voids.
 */
export const test_engine_canonical_planar_region = (): void => {
  const holed = triangulateAutoMovieRegion({
    outer: square,
    holes: [
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
    ],
  });
  TestValidator.equals(
    "a valid holed region remains constructible and drawing remains triangulable",
    {
      area: holed.area,
      rings: holed.rings.length,
      triangles: holed.triangles.length > 0,
      drawing: triangulateAutoMoviePolygon(square).length,
    },
    { area: 15, rings: 2, triangles: true, drawing: 2 },
  );

  const failure = autoMoviePlanarRegionFailure({ outer: crossing });
  TestValidator.equals(
    "the canonical boundary names a self-crossing ring",
    typeof failure === "string" && failure.includes("crosses itself"),
    true,
  );
  const footprint = {
    outer: footprintRing(
      crossing.map((point) => ({ x: point.x, y: 0, z: point.y })),
    ),
    holes: [],
  };
  TestValidator.equals(
    "constructors refuse the same defect while the query-safe footprint returns no invented pieces",
    {
      procedural: throwsError(
        () => triangulateAutoMovieRegion({ outer: crossing }),
        "crosses itself",
      ),
      drawing: throwsError(
        () => triangulateAutoMoviePolygon(crossing),
        "crosses itself",
      ),
      footprint: footprintConvexPieces(footprint).length,
      staleArea: footprintConvexPieces({
        outer: {
          ...footprintRing(
            square.map((point) => ({ x: point.x, y: 0, z: point.y })),
          ),
          doubleArea: 0,
        },
        holes: [],
      }).length,
    },
    { procedural: true, drawing: true, footprint: 0, staleArea: 0 },
  );

  TestValidator.equals(
    "numeric, adjacent-duplicate, and ring-relation boundaries are refused",
    {
      nonfinite: autoMoviePlanarRegionFailure({
        outer: [{ ...square[0]!, x: NaN }, ...square.slice(1)],
      })?.includes("finite"),
      duplicate: autoMoviePlanarRegionFailure({
        outer: [square[0]!, square[1]!, square[1]!, square[2]!, square[3]!],
      })?.includes("repeats"),
      touchingHole: autoMoviePlanarRegionFailure({
        outer: square,
        holes: [
          [
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 0, y: 2 },
          ],
        ],
      })?.includes("touch or cross"),
      outsideHole: autoMoviePlanarRegionFailure({
        outer: square,
        holes: [
          [
            { x: 5, y: 5 },
            { x: 6, y: 5 },
            { x: 6, y: 6 },
            { x: 5, y: 6 },
          ],
        ],
      })?.includes("must lie inside"),
    },
    {
      nonfinite: true,
      duplicate: true,
      touchingHole: true,
      outsideHole: true,
    },
  );

  TestValidator.equals(
    "short, area-free, spiked, redundant, and nested rings keep distinct outcomes",
    {
      short: autoMoviePlanarRegionFailure({
        outer: square.slice(0, 2),
      })?.includes("at least three"),
      areaFree: autoMoviePlanarRegionFailure({
        outer: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      })?.includes("encloses no area"),
      spike: autoMoviePlanarRegionFailure({
        outer: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      })?.includes("doubles back"),
      redundantStraightPoint:
        autoMoviePlanarRegionFailure({
          outer: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 0, y: 2 },
          ],
        }) === null,
      nested: autoMoviePlanarRegionFailure({
        outer: square,
        holes: [
          [
            { x: 0.5, y: 0.5 },
            { x: 0.5, y: 3.5 },
            { x: 3.5, y: 3.5 },
            { x: 3.5, y: 0.5 },
          ],
          [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: 1 },
          ],
        ],
      })?.includes("must lie outside"),
      disjoint:
        autoMoviePlanarRegionFailure({
          outer: square,
          holes: [
            [
              { x: 0.5, y: 0.5 },
              { x: 0.5, y: 1 },
              { x: 1, y: 1 },
              { x: 1, y: 0.5 },
            ],
            [
              { x: 3, y: 3 },
              { x: 3, y: 3.5 },
              { x: 3.5, y: 3.5 },
              { x: 3.5, y: 3 },
            ],
          ],
        }) === null,
    },
    {
      short: true,
      areaFree: true,
      spike: true,
      redundantStraightPoint: true,
      nested: true,
      disjoint: true,
    },
  );

  TestValidator.equals(
    "drawing retains its established short-ring diagnostic",
    throwsError(
      () => triangulateAutoMoviePolygon(square.slice(0, 2)),
      "needs at least 3 corners to triangulate",
    ),
    true,
  );
};
