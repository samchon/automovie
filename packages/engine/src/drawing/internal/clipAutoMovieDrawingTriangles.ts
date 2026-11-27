import {
  IAutoMovieDrawingFrame,
  type IAutoMovieDrawingTriangle,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";
import { AUTOMOVIE_DRAWING_EPSILON } from "../AUTOMOVIE_DRAWING_EPSILON";

/**
 * Keep only the part of a triangle soup beyond the cut plane, the side a cut
 * leaves standing.
 *
 * Each triangle is clipped against the plane, with corners within
 * {@link AUTOMOVIE_DRAWING_EPSILON} of it kept, and the surviving convex polygon
 * is re-fanned into triangles that keep the source winding. New edges lying in
 * the plane are exactly what the cut linework draws, and the drafter drops
 * their silhouette so no segment is drafted twice.
 *
 * @param frame Page basis whose origin and normal define the cut plane.
 * @param triangles World triangles of one drawable.
 * @returns The kept triangles, in input order, in world metres.
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
