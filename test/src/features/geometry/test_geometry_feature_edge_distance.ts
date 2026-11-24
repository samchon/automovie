import {
  autoMovieFeatureEdgeDistance,
  measureAutoMovieFeatureEdges,
} from "@automovie/engine";
import type {
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { surfaceTriangleOf } from "../internal/surfaceTriangleOf";
import { throwsError } from "../internal/throwsError";

/**
 * Feature edges carry their sign: an L-shaped extrusion's inner crease is
 * concave and every other sharp edge convex, and the distance reference
 * measures to the nearest of each sign.
 *
 * The L is the profile (0, 0), (2, 0), (2, 1), (1, 1), (1, 2), (0, 2) in
 * metres, extruded 1 m along Z, wound counter-clockwise from outside, with
 * every side and cap split into unit squares so all faces meet vertex to
 * vertex.
 *
 * Scenarios:
 *
 * 1. Exactly one feature edge is concave, the vertical crease at x = 1, y = 1; the
 *    21 others (5 outer vertical corners and 16 unit cap rim edges) are
 *    convex.
 * 2. A point on the inner face x = 1, 0.01 m from the crease, has `dGrime` 0.01
 *    within 1e-9 with `reach: 0.05`.
 * 3. A point on the outer face x = 2, 0.02 m below its top rim and far from any
 *    crease, has `dEdge` 0.02 and `dGrime` capped at the reach.
 * 4. A triangle index outside the mesh throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures a hand-built extrusion and queries distances; a convexity test with the wrong sign, a crease missed or a distance to the wrong segment fails.
 * @evidence contracts/development/testing.md#independent-expectations The crease, the corner counts and the distances follow from the profile's geometry, worked out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Concave against convex, a distance inside the reach and one capped at it, and a bad index; box and cylinder topology are owned by `test_geometry_feature_edges`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_geometry_feature_edge_distance`, with an in-memory mesh.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_geometry_feature_edge_distance(): void {
  const { positions, indices }: ReturnType<typeof extrudeL> = extrudeL();
  const measured: IAutoMovieMeasureFeatureEdges.IResult =
    measureAutoMovieFeatureEdges({ positions, indices, reach: 0.05 });

  // 1. One concave crease.
  const concave: IAutoMovieMeasureFeatureEdges.IEdge[] = measured.edges.filter(
    (edge: IAutoMovieMeasureFeatureEdges.IEdge): boolean => !edge.convex,
  );
  TestValidator.predicate(
    `one concave crease at (1, 1) and 21 convex edges (${measured.edges.length})`,
    measured.edges.length === 22 &&
      concave.length === 1 &&
      [concave[0]!.a, concave[0]!.b].every(
        (p: IAutoMovieVector3): boolean => p.x === 1 && p.y === 1,
      ),
  );

  // 2 and 3. Distances.
  const at: (
    point: IAutoMovieVector3,
  ) => ReturnType<typeof autoMovieFeatureEdgeDistance> = (
    point: IAutoMovieVector3,
  ): ReturnType<typeof autoMovieFeatureEdgeDistance> =>
    autoMovieFeatureEdgeDistance({
      edges: measured,
      triangle: surfaceTriangleOf(positions, indices, point),
      point,
    });
  TestValidator.predicate(
    "0.01 m from the crease on the inner face",
    nclose(at({ x: 1, y: 1.01, z: 0.5 }).concave, 0.01, 1e-9),
  );
  const outer: ReturnType<typeof autoMovieFeatureEdgeDistance> = at({
    x: 2,
    y: 0.5,
    z: 0.98,
  });
  TestValidator.predicate(
    "0.02 m below the outer face's rim, no crease within reach",
    nclose(outer.convex, 0.02, 1e-9) && outer.concave === 0.05,
  );

  // 4. Bad triangle.
  TestValidator.predicate(
    "an unmeasured triangle throws",
    throwsError(() =>
      autoMovieFeatureEdgeDistance({
        edges: measured,
        triangle: indices.length,
        point: { x: 0, y: 0, z: 0 },
      }),
    ),
  );
}

/** The L profile extruded along Z, each face with its own vertices. */
function extrudeL(): { positions: number[]; indices: number[] } {
  const profile: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [0, 2],
    [0, 1],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  const quad: (a: number[], b: number[], c: number[], d: number[]) => void = (
    a: number[],
    b: number[],
    c: number[],
    d: number[],
  ): void => {
    const base: number = positions.length / 3;
    positions.push(...a, ...b, ...c, ...d);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  profile.forEach(([x0, y0]: [number, number], i: number): void => {
    const [x1, y1]: [number, number] = profile[(i + 1) % profile.length]!;
    quad([x0, y0, 0], [x1, y1, 0], [x1, y1, 1], [x0, y0, 1]);
  });
  for (const [x, y] of [
    [0, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    quad([x, y, 1], [x + 1, y, 1], [x + 1, y + 1, 1], [x, y + 1, 1]);
    quad([x, y, 0], [x, y + 1, 0], [x + 1, y + 1, 0], [x + 1, y, 0]);
  }
  return { positions, indices };
}
