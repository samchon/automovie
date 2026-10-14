import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieDrawingEdge } from "./IAutoMovieDrawingEdge";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";

/**
 * Where the cut plane passes through a triangle soup, as world segments.
 *
 * One segment per triangle with a corner strictly on each side of the plane,
 * beyond {@link AUTOMOVIE_DRAWING_EPSILON}. A triangle lying in the plane, or
 * only touching it, contributes nothing: a face tangent to the cut is not a
 * section, and emitting its edges would draw every interior diagonal of a slab
 * whose top sits at the cut height.
 *
 * Segments are neither joined into loops nor deduplicated; the drafter rounds
 * and deduplicates them with the rest of the linework.
 *
 * @param frame Page basis whose origin and normal define the cut plane.
 * @param triangles World triangles of one drawable.
 * @returns One world segment per straddling triangle, in input order.
 *
 * @evidence contracts/common.md#principled-implementation Classifies each corner by its signed plane distance and interpolates linearly along each edge whose ends change sign, which is exact for a plane and a straight edge; a triangle with a corner strictly on each side always yields two crossing points, either two crossed edges or one crossed edge plus a corner within tolerance of the plane, so the first two hits form the segment.
 * @evidence contracts/common.md#clear-and-simple-design One function computes the section of a soup and delegates the distance to `autoMovieDrawingPlaneDistance`, the single definition the clip and the drafter also use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle or element is special-cased; coplanar and touching triangles are skipped by the stated tangency rule, not by a filter tuned to a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states which triangles produce a segment and why tangent ones do not, that segments stay unjoined and undeduplicated, the plane definition and the output order.
 * @evidence contracts/performance.md#efficient-algorithms One pass over `t` triangles with three distance evaluations each, linear time and at most `t` output segments; every triangle must be visited because any of them may straddle the plane.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per drawable per cut view, so nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh array owned by the caller and keeps nothing after returning.
 * @author Samchon
 */
export const autoMovieDrawingCutEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const edges: IAutoMovieDrawingEdge[] = [];
  for (const triangle of triangles) {
    const corners: IAutoMovieVector3[] = [triangle.a, triangle.b, triangle.c];
    const distances: number[] = corners.map(
      (corner: IAutoMovieVector3): number =>
        autoMovieDrawingPlaneDistance(frame, corner),
    );
    const above: boolean = distances.some(
      (value: number): boolean => value > AUTOMOVIE_DRAWING_EPSILON,
    );
    const below: boolean = distances.some(
      (value: number): boolean => value < -AUTOMOVIE_DRAWING_EPSILON,
    );
    if (!above || !below) continue;
    const hits: IAutoMovieVector3[] = [];
    for (let index: number = 0; index < 3; ++index) {
      const next: number = (index + 1) % 3;
      const da: number = distances[index]!;
      const db: number = distances[next]!;
      if (Math.abs(da) <= AUTOMOVIE_DRAWING_EPSILON) {
        hits.push(corners[index]!);
        continue;
      }
      if (da * db < 0)
        hits.push(
          Vector3.lerp(corners[index]!, corners[next]!, da / (da - db)),
        );
    }
    edges.push({ from: hits[0]!, to: hits[1]! });
  }
  return edges;
};
