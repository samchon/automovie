import { IAutoMovieDrawingFrame, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";
import { IAutoMovieDrawingEdge } from "./IAutoMovieDrawingEdge";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";

/**
 * Where the cut plane passes through a triangle soup.
 *
 * One segment per straddling triangle. A triangle that lies exactly in the
 * plane contributes nothing: a face tangent to the cut is a tangency, not a
 * section, and emitting its three edges would scribble every interior diagonal
 * of a slab whose top happened to sit at the cut height.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Emits the precise section segment where each straddling source triangle crosses the authored cut plane.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Classifies triangle corners by signed distance, interpolates the two crossings, and suppresses coplanar tangencies.
 */
export const autoMovieDrawingCutEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const edges: IAutoMovieDrawingEdge[] = [];
  for (const triangle of triangles) {
    const corners = [triangle.a, triangle.b, triangle.c];
    const distances = corners.map((corner) =>
      autoMovieDrawingPlaneDistance(frame, corner),
    );
    const above = distances.some((value) => value > AUTOMOVIE_DRAWING_EPSILON);
    const below = distances.some((value) => value < -AUTOMOVIE_DRAWING_EPSILON);
    if (!above || !below) continue;
    const hits: IAutoMovieVector3[] = [];
    for (let index = 0; index < 3; ++index) {
      const next = (index + 1) % 3;
      const da = distances[index]!;
      const db = distances[next]!;
      if (Math.abs(da) <= AUTOMOVIE_DRAWING_EPSILON) {
        hits.push(corners[index]!);
        continue;
      }
      if (da * db < 0)
        hits.push(
          Vector3.lerp(corners[index]!, corners[next]!, da / (da - db)),
        );
    }
    // A triangle with a vertex strictly on each side of the plane always yields
    // exactly two crossing points: either two edges cross it, or one edge does
    // and the third vertex sits on it. There is no one-point case to guard.
    edges.push({ from: hits[0]!, to: hits[1]! });
  }
  return edges;
};
