import { TestValidator } from "@nestia/e2e";

import {
  closestPointInTriangle,
  crossedCorners,
  meshOfSegment,
  neighboursOf,
  surfaceOfSegment,
} from "../../../scripts/body-basis/bodyContactGeometry";
import { nclose } from "../internal/predicates";

const near = (found: number[], expected: number[]): boolean =>
  found.length === expected.length &&
  found.every((value, at) => nclose(value, expected[at], 1e-12));

/**
 * The triangle-soup geometry the body contact solver stands on: a segment as
 * a compact mesh, the corners that pierce another segment, the neighbour
 * graph, the closest point of a triangle and the signed nearest-surface
 * query.
 *
 * Every expectation is hand arithmetic on triangles a few unit lengths wide.
 *
 * Scenarios:
 * 1. A segment of two triangles sharing an edge, over a buffer whose vertex
 *    ids are far apart, becomes four compact vertices and the index list
 *    renumbered in first-seen order.
 * 2. A triangle pierced by a second one reports its own three corners, the
 *    second reading the mirror set; the negative twin, the same triangle
 *    moved away, and a triangle that only shares an edge report nothing.
 * 3. The neighbour graph of two triangles over one edge lists each vertex's
 *    edge partners once.
 * 4. The closest point of a triangle takes the vertex for each of the three
 *    vertex regions, the foot on the edge for each of the three edge regions
 *    and the projection inside the face.
 * 5. The nearest-surface query of one upward-wound triangle reports the
 *    projected point, the upward normal and a positive distance above, a
 *    negative distance below.
 */
export const test_human_body_contact_geometry = (): void => {
  // 1. compaction
  const wide = new Array<number>(36).fill(0);
  const put = (vertex: number, x: number, y: number, z: number): void => {
    wide[vertex * 3] = x;
    wide[vertex * 3 + 1] = y;
    wide[vertex * 3 + 2] = z;
  };
  put(5, 0, 0, 0);
  put(7, 1, 0, 0);
  put(9, 0, 1, 0);
  put(11, 1, 1, 0);
  const mesh = meshOfSegment(wide, [5, 7, 9, 9, 7, 11]);
  TestValidator.equals(
    "compact mesh keeps first-seen order",
    mesh.positions,
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
  );
  TestValidator.equals("compact indices", mesh.indices, [0, 1, 2, 2, 1, 3]);

  // 2. crossing corners
  const flat = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const piercing = [0.2, 0.2, -1, 0.3, 0.2, 1, 0.2, 0.3, 1];
  const both = [...flat, ...piercing];
  TestValidator.equals(
    "a pierced triangle reports its own corners",
    [...crossedCorners(both, [0, 1, 2], [3, 4, 5])].sort((a, b) => a - b),
    [0, 1, 2],
  );
  TestValidator.equals(
    "the piercing triangle reports its corners against the flat one",
    [...crossedCorners(both, [3, 4, 5], [0, 1, 2])].sort((a, b) => a - b),
    [3, 4, 5],
  );
  const away = [...flat, ...piercing.map((value, at) => (at % 3 === 0 ? value + 10 : value))];
  TestValidator.equals(
    "a triangle moved away crosses nothing",
    crossedCorners(away, [0, 1, 2], [3, 4, 5]).size,
    0,
  );
  const shared = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0];
  TestValidator.equals(
    "triangles sharing an edge only touch",
    crossedCorners(shared, [0, 1, 2], [2, 1, 3]).size,
    0,
  );

  // 3. neighbours
  const graph = neighboursOf([0, 1, 2, 2, 1, 3], 4).map((list) =>
    [...list].sort((a, b) => a - b),
  );
  TestValidator.equals("neighbour graph", graph, [
    [1, 2],
    [0, 2, 3],
    [0, 1, 3],
    [1, 2],
  ]);

  // 4. closest point in a triangle
  const a = [0, 0, 0];
  const b = [1, 0, 0];
  const c = [0, 1, 0];
  const closest = (p: number[]): number[] =>
    closestPointInTriangle(p, a, b, c);
  for (const [title, p, expected] of [
    ["vertex a region", [-1, -1, 1], [0, 0, 0]],
    ["vertex b region", [2, -1, 0], [1, 0, 0]],
    ["vertex c region", [-1, 2, 0], [0, 1, 0]],
    ["edge ab region", [0.5, -1, 0], [0.5, 0, 0]],
    ["edge ac region", [-1, 0.5, 0], [0, 0.5, 0]],
    ["edge bc region", [1, 1, 0], [0.5, 0.5, 0]],
    ["face region", [0.2, 0.2, 3], [0.2, 0.2, 0]],
  ] as [string, number[], number[]][])
    TestValidator.predicate(title, near(closest(p), expected));

  // 5. nearest surface
  const query = surfaceOfSegment(flat, [0, 1, 2]);
  const above = query([0.2, 0.2, 0.3]);
  const below = query([0.2, 0.2, -0.3]);
  TestValidator.predicate("projected point", near(above.at, [0.2, 0.2, 0]));
  TestValidator.predicate("upward normal", near(above.normal, [0, 0, 1]));
  TestValidator.predicate("above is positive", nclose(above.away, 0.3, 1e-12));
  TestValidator.predicate("below is negative", nclose(below.away, -0.3, 1e-12));
};
