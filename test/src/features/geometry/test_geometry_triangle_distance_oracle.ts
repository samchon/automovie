import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../internal/closestTriangleDistanceSquaredOracle";
import { nclose } from "../internal/predicates";

/**
 * The independent exhaustive oracle covers all seven triangle Voronoi regions.
 * Expected squared distances follow a right triangle with two-metre edges;
 * they are hand-derived from its vertices, closed edges and interior plane.
 *
 * Scenarios:
 * 1. Vertex A/B/C each lies one metre away in both planar axes and height.
 * 2. AB/AC edge regions have two squared metres; BC has three.
 * 3. An interior point has only its one-metre height and an on-face point zero.
 */
export const test_geometry_triangle_distance_oracle=():void=>{
  const a=[0,0,0],b=[2,0,0],c=[0,2,0];
  for(const [region,point,expected] of [
    ["A",[-1,-1,1],3],["B",[3,-1,1],3],["AB",[1,-1,1],2],
    ["C",[-1,3,1],3],["AC",[-1,1,1],2],["BC",[2,2,1],3],
    ["face",[.5,.5,1],1],["surface",[.5,.5,0],0],
  ] as const)TestValidator.predicate(`${region} follows the authored Euclidean metric`,nclose(closestTriangleDistanceSquaredOracle(point,a,b,c),expected,1e-12));
};
