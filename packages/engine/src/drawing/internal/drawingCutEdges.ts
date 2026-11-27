import {
  type IAutoMovieDrawingEdge,
  IAutoMovieDrawingFrame,
  type IAutoMovieDrawingTriangle,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { drawingPlaneDistance } from "./drawingPlaneDistance";
import { AutoMovieEngineDrawingEpsilon } from "../AutoMovieEngineDrawingEpsilon";

/*
 * Where the cut plane passes through a triangle soup, as world segments.
 *
 * One segment per triangle with a corner strictly on each side of the plane,
 * beyond AutoMovieEngineDrawingEpsilon. A triangle lying in the plane, or
 * only touching it, contributes nothing: a face tangent to the cut is not a
 * section, and emitting its edges would draw every interior diagonal of a slab
 * whose top sits at the cut height.
 *
 * Segments are neither joined into loops nor deduplicated; the drafter rounds
 * and deduplicates them with the rest of the linework.
 * Parameter frame: Page basis whose origin and normal define the cut plane.
 * Parameter triangles: World triangles of one drawable.
 * Returns: One world segment per straddling triangle, in input order.
 */
export const drawingCutEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const edges: IAutoMovieDrawingEdge[] = [];
  for (const triangle of triangles) {
    const corners: IAutoMovieVector3[] = [triangle.a, triangle.b, triangle.c];
    const distances: number[] = corners.map(
      (corner: IAutoMovieVector3): number =>
        drawingPlaneDistance(frame, corner),
    );
    const above: boolean = distances.some(
      (value: number): boolean => value > AutoMovieEngineDrawingEpsilon,
    );
    const below: boolean = distances.some(
      (value: number): boolean => value < -AutoMovieEngineDrawingEpsilon,
    );
    if (!above || !below) continue;
    const hits: IAutoMovieVector3[] = [];
    for (let index: number = 0; index < 3; ++index) {
      const next: number = (index + 1) % 3;
      const da: number = distances[index]!;
      const db: number = distances[next]!;
      if (Math.abs(da) <= AutoMovieEngineDrawingEpsilon) {
        hits.push(corners[index]!);
        continue;
      }
      if (da * db < 0)
        hits.push(
          AutoMovieEngineVector3.lerp(corners[index]!, corners[next]!, da / (da - db)),
        );
    }
    edges.push({ from: hits[0]!, to: hits[1]! });
  }
  return edges;
};
