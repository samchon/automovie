import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";

/**
 * Keep only the part of a triangle soup beyond the cut plane, the side a cut
 * leaves standing.
 *
 * Each triangle is clipped against the plane, with corners within
 * {@link AUTOMOVIE_DRAWING_EPSILON} of it kept, and the surviving convex
 * polygon is re-fanned into triangles that keep the source winding.
 * New edges lying in the plane are exactly what the cut linework draws, and
 * the drafter drops their silhouette so no segment is drafted twice.
 *
 * @param frame Page basis whose origin and normal define the cut plane.
 * @param triangles World triangles of one drawable.
 * @returns The kept triangles, in input order, in world metres.
 *
 * @evidence contracts/common.md#principled-implementation Sutherland-Hodgman clipping of each triangle by one plane, which is exact for a convex polygon and a half-space and keeps corner order, so the fan from the first kept corner preserves the right-hand winding the silhouette pass reads.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the half-space clip of a soup and shares the plane distance with cut extraction, so both agree on which side a corner is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle or element is special-cased; on-plane corners are kept by the shared tolerance, and the duplicate in-plane silhouette is removed by the caller's stated rule rather than here.
 * @evidence contracts/common.md#meaningful-documentation The comment states which side is kept, the tolerance, the re-fanning and winding preservation, and how in-plane edges are treated downstream.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `t` triangles with constant work each, emitting at most three triangles per input, the third only when a corner within tolerance of the plane also contributes a crossing point, so time and output are linear in `t`; every triangle must be visited because any may straddle the plane.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per drawable and role per derivation; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each triangle's clipped polygon is a temporary; only the returned array, owned by the caller, survives.
 */
export const clipAutoMovieDrawingTriangles = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] => {
  const kept: IAutoMovieDrawingTriangle[] = [];
  for (const triangle of triangles) {
    const corners: IAutoMovieVector3[] = [triangle.a, triangle.b, triangle.c];
    const distances: number[] = corners.map(
      (corner: IAutoMovieVector3): number =>
        autoMovieDrawingPlaneDistance(frame, corner),
    );
    const polygon: IAutoMovieVector3[] = [];
    for (let index: number = 0; index < 3; ++index) {
      const next: number = (index + 1) % 3;
      const da: number = distances[index]!;
      const db: number = distances[next]!;
      if (da <= AUTOMOVIE_DRAWING_EPSILON) polygon.push(corners[index]!);
      if (da * db < 0)
        polygon.push(
          Vector3.lerp(corners[index]!, corners[next]!, da / (da - db)),
        );
    }
    for (let index: number = 1; index + 1 < polygon.length; ++index)
      kept.push({
        a: polygon[0]!,
        b: polygon[index]!,
        c: polygon[index + 1]!,
      });
  }
  return kept;
};
