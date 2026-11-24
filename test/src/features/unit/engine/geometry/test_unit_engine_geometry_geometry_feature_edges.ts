import {
  autoMovieFeatureEdgeDistance,
  measureAutoMovieFeatureEdges,
  tessellate,
} from "@automovie/engine";
import type {
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieTessellation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { surfaceTriangleOf } from "../../../internal/surfaceTriangleOf";
import { throwsError } from "../../../internal/throwsError";

/**
 * Feature edges are the sharp bends of a welded mesh: a box's twelve edges and
 * a cylinder's two rims, never a face diagonal or a facet seam below 30°.
 *
 * Scenarios:
 *
 * 1. The 1 m box from `tessellate`, whose 24 vertices split every corner by face,
 *    has exactly 12 feature edges, all convex, each 1 m long and parallel to an
 *    axis, so no face diagonal is one.
 * 2. With `reach: 0.05`, a point at the centre of the +Y face lists no convex
 *    segment within reach (its distance is capped at 0.05), and a point on the
 *    +Y face 0.005 m from the middle of its edge with the +X face has `dEdge`
 *    0.005 within 1e-9.
 * 3. A 16-segment cylinder from `tessellate`, whose side facets meet at 22.5°, has
 *    feature edges only on its two cap rims: 32 convex segments at |y| = half
 *    the height.
 * 4. The same mesh measured twice gives deep-equal output, and a non-positive
 *    reach throws.
 */
export function test_unit_engine_geometry_geometry_feature_edges(): void {
  const box: IAutoMovieTessellation = tessellate({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  const measured: IAutoMovieMeasureFeatureEdges.IResult =
    measureAutoMovieFeatureEdges({
      positions: box.positions,
      indices: box.indices,
      reach: 0.05,
    });

  // 1. Twelve convex axis-parallel unit edges.
  TestValidator.predicate(
    `the box has 12 convex unit edges along the axes (${measured.edges.length})`,
    measured.edges.length === 12 &&
      measured.edges.every(
        (edge: IAutoMovieMeasureFeatureEdges.IEdge): boolean => {
          const d: IAutoMovieVector3 = {
            x: Math.abs(edge.b.x - edge.a.x),
            y: Math.abs(edge.b.y - edge.a.y),
            z: Math.abs(edge.b.z - edge.a.z),
          };
          return (
            edge.convex &&
            nclose(d.x + d.y + d.z, 1, 1e-12) &&
            [d.x, d.y, d.z].filter((v: number): boolean => v > 1e-12).length ===
              1
          );
        },
      ),
  );

  // 2. Distances on the +Y face.
  const centre: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0 };
  const near: IAutoMovieVector3 = { x: 0.495, y: 0.5, z: 0 };
  const at: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number =>
    autoMovieFeatureEdgeDistance({
      edges: measured,
      triangle: surfaceTriangleOf(box.positions, box.indices, point),
      point,
    }).convex;
  TestValidator.predicate(
    "the face centre has no convex edge within reach",
    at(centre) === 0.05,
  );
  TestValidator.predicate(
    "0.005 m from the middle of the +Y/+X edge",
    nclose(at(near), 0.005, 1e-9),
  );

  // 3. The cylinder's rims only.
  const cylinder: IAutoMovieTessellation = tessellate({
    type: "cylinder",
    radius: 0.3,
    height: 1,
  });
  const rims: IAutoMovieMeasureFeatureEdges.IResult =
    measureAutoMovieFeatureEdges({
      positions: cylinder.positions,
      indices: cylinder.indices,
      reach: 0.05,
    });
  TestValidator.predicate(
    `the cylinder has 32 convex rim edges only (${rims.edges.length})`,
    rims.edges.length === 32 &&
      rims.edges.every(
        (edge: IAutoMovieMeasureFeatureEdges.IEdge): boolean =>
          edge.convex &&
          nclose(Math.abs(edge.a.y), 0.5, 1e-12) &&
          nclose(edge.a.y, edge.b.y, 1e-12),
      ),
  );

  // 4. Repeatability and refusal.
  TestValidator.equals(
    "measuring twice gives equal output",
    measureAutoMovieFeatureEdges({
      positions: box.positions,
      indices: box.indices,
      reach: 0.05,
    }),
    measured,
  );
  TestValidator.predicate(
    "a zero reach throws",
    throwsError(() =>
      measureAutoMovieFeatureEdges({
        positions: box.positions,
        indices: box.indices,
        reach: 0,
      }),
    ),
  );
}
