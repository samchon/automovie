import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshPlaneCut,
} from "@automovie/interface";

import { prepareCutExact } from "./prepareCutExact";

/**
 * Intersect a triangle surface with a plane without epsilon displacement or
 * branch loss. Equal signed zero vertices retain exact source positions.
 * Coplanar triangles contribute only qualified patch-boundary edges; binary64
 * signs are not exact predicates. Every graph edge is visited once in maximal
 * degree-two chains, so junctions terminate separate open chains. Isolated
 * tangent contacts return one-point open polylines instead of disappearing. A
 * supplied scalar chart shares the exact height samples used for PL topology;
 * its signs and edge fractions use height minus level without reprojecting an
 * origin.
 */
export function cutExact(
  skin: Parameters<IAutoMovieMeshPlaneCut.Operation>[0],
  plane: Parameters<IAutoMovieMeshPlaneCut.Operation>[1],
  select?: Parameters<IAutoMovieMeshPlaneCut.Operation>[2],
  chart?: Parameters<IAutoMovieMeshPlaneCut.Operation>[3],
): ReturnType<IAutoMovieMeshPlaneCut.Operation> {
  const heights: readonly number[] =
    chart?.heights ??
    skin.vertices.map(
      (p: AutoMovieVector3Tuple): number =>
        (p[0] - plane.origin[0]) * plane.n[0] +
        (p[1] - plane.origin[1]) * plane.n[1] +
        (p[2] - plane.origin[2]) * plane.n[2],
    );
  const level: number = chart?.level ?? 0;
  return prepareCutExact(skin, heights)(plane, level, undefined, select);
}
