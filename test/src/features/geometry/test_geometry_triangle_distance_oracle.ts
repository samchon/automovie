import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../internal/closestTriangleDistanceSquaredOracle";
import { nclose } from "../internal/predicates";

/**
 * The independent exhaustive oracle covers all seven triangle Voronoi regions. Expected squared distances follow a right triangle with two-metre edges; they are hand-derived from its vertices, closed edges and interior plane.
 *
 * Scenarios:
 * 1. Vertex A/B/C each lies one metre away in both planar axes and height.
 * 2. AB/AC edge regions have two squared metres; BC has three.
 * 3. An interior point has only its one-metre height and an on-face point zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production open-sheet query and calibrates the independent triangle-distance reference on the same hand-solvable Voronoi regions; a wrong production region, metric or reference result fails.
 * @evidence contracts/testing.md#independent-expectations A right triangle with two-metre legs gives vertex distances 3, edge distances 2 or 3, interior height distance 1 and on-face distance 0 by Euclidean geometry.
 * @evidence contracts/testing.md#distinguishing-cases All seven nondegenerate Voronoi regions and exact face contact compare both implementations with authored distances; closed-surface sign, malformed mesh admission and multi-triangle traversal belong to the signed-mesh-query units that consume this reference.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_triangle_distance_oracle entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_triangle_distance_oracle(): void {
  const a: number[]=[0,0,0],b: number[]=[2,0,0],c: number[]=[0,2,0];
  const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery({
    positions: [...a, ...b, ...c],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  }, { boundary: "open" });
  for(const [region,point,expected] of [
    ["A",[-1,-1,1],3],["B",[3,-1,1],3],["AB",[1,-1,1],2],
    ["C",[-1,3,1],3],["AC",[-1,1,1],2],["BC",[2,2,1],3],
    ["face",[.5,.5,1],1],["surface",[.5,.5,0],0],
  ] as const) {
    TestValidator.predicate(`${region} follows the authored Euclidean metric`,nclose(closestTriangleDistanceSquaredOracle(point,a,b,c),expected,1e-12));
    const distance: number = query(point).distance;
    TestValidator.predicate(`${region} production query follows the authored Euclidean metric`, nclose(distance * distance, expected, 1e-12));
  }
}
