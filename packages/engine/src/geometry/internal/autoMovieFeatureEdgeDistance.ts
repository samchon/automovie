import type {
  IAutoMovieFeatureEdgeDistance,
  IAutoMovieMeasureFeatureEdges,
} from "@automovie/interface";

import { pointSegmentDistance } from "../../math/internal/pointSegmentDistance";

/*
 * The distances from a point on one triangle of a measured mesh to the nearest
 * convex and the nearest concave feature edge in that triangle's list, capped
 * at `reach`: the CPU reference of what a worn material's fragment shader
 * computes at its bind-pose position.
 *
 * Every list holds each feature edge within reach of its triangle, so for a
 * point on the triangle any edge nearer than `reach` is listed, unless the list
 * hit its limit of 16. The capped result is therefore the exact distance to the
 * nearest feature edge of each sign whenever that distance is below `reach`,
 * and `reach` otherwise, however finely the faces are tessellated.
 * When `triangle` is not an index of the measured triangles.
 */
export function autoMovieFeatureEdgeDistance(
  props: IAutoMovieFeatureEdgeDistance.IProps,
): IAutoMovieFeatureEdgeDistance.IResult {
  const list: number[] | undefined = props.edges.triangles[props.triangle];
  if (list === undefined)
    throw new Error(`feature edge triangle ${props.triangle} is not measured`);
  let convex: number = props.edges.reach;
  let concave: number = props.edges.reach;
  for (const index of list) {
    const edge: IAutoMovieMeasureFeatureEdges.IEdge = props.edges.edges[index]!;
    const distance: number = pointSegmentDistance(props.point, edge.a, edge.b);
    if (edge.convex) convex = Math.min(convex, distance);
    else concave = Math.min(concave, distance);
  }
  return { convex, concave };
}
