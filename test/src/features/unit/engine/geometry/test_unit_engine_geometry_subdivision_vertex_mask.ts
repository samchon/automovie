import { subdivisionVertexMask } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `subdivisionVertexMask(sharpness, faceCount)` is the Catmull-Clark vertex
 * mask by the count of sharp fan edges: at most one takes (n - 2) / n on the
 * vertex and 1 / n^2 on each neighbour and face; two take the crease rule 3/4
 * and 1/8 on the two sharp neighbours; three or more keep the vertex. When one
 * step of decay changes the rule, the parent and child masks blend by the mean
 * sharpness of the edges turning smooth (DeRose, Kass and Truong 1998).
 *
 * Scenarios:
 *
 * 1. Valence 4 smooth: 1/2, edges and faces 1/16; a dart (one edge at 3) the
 *    same.
 * 2. Two edges at 2 (still sharp after decay): 3/4, edges [1/8, 0, 1/8, 0], faces
 *    0; a boundary vertex [10, 0, 10] with two faces the same.
 * 3. Three edges at 10: the vertex kept, weight 1.
 * 4. Two edges at 0.5 turn smooth: blend weight 0.5 gives 0.625, edges
 *    [0.09375, 0.03125, 0.09375, 0.03125], faces 0.03125.
 */
export function test_unit_engine_geometry_subdivision_vertex_mask(): void {
  const s: number = 1 / 16;

  // 1.
  for (const [label, sharpness] of [
    ["smooth", [0, 0, 0, 0]],
    ["dart", [3, 0, 0, 0]],
  ] satisfies [string, number[]][])
    TestValidator.equals(label, subdivisionVertexMask(sharpness, 4), { vertex: 0.5, edges: [s, s, s, s], faces: [s, s, s, s] });

  // 2.
  TestValidator.equals("crease", subdivisionVertexMask([2, 0, 2, 0], 4), { vertex: 0.75, edges: [0.125, 0, 0.125, 0], faces: [0, 0, 0, 0] });
  TestValidator.equals("boundary", subdivisionVertexMask([10, 0, 10], 2), { vertex: 0.75, edges: [0.125, 0, 0.125], faces: [0, 0] });

  // 3.
  TestValidator.equals("corner", subdivisionVertexMask([10, 10, 10], 2), { vertex: 1, edges: [0, 0, 0], faces: [0, 0] });

  // 4.
  TestValidator.equals("blend", subdivisionVertexMask([0.5, 0, 0.5, 0], 4), {
    vertex: 0.625,
    edges: [0.09375, 0.03125, 0.09375, 0.03125],
    faces: [0.03125, 0.03125, 0.03125, 0.03125],
  });
}
