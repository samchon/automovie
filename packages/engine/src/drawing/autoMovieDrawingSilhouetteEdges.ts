import { IAutoMovieDrawingFrame, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "./AUTOMOVIE_DRAWING_EPSILON";
import { IAutoMovieDrawingEdge } from "./IAutoMovieDrawingEdge";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Silhouette of a triangle soup under the view's orthographic direction.
 *
 * An edge is drawn when the faces meeting along it disagree about facing the
 * viewer, or when only one face owns it. Faces exactly edge-on count as facing
 * away, which is what makes a plan of an upright box its four top edges rather
 * than nothing at all: the top faces the viewer, the four walls are edge-on and
 * so count as away, and the disagreement along each top edge is the outline.
 *
 * Vertices are welded on the rounded output grid before edges are keyed, so two
 * triangles that meet at a shared corner are recognised as meeting there even
 * when the arithmetic that produced the corner differed by a last bit.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Extracts the visible boundary of projected source geometry without drafting its internal triangulation.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Welds rounded vertices and retains only singly owned edges or edges shared by oppositely facing facets.
 */
export const autoMovieDrawingSilhouetteEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const key = (point: IAutoMovieVector3): string =>
    `${roundAutoMovieDrawingScalar(point.x)},${roundAutoMovieDrawingScalar(point.y)},${roundAutoMovieDrawingScalar(point.z)}`;
  const owners = new Map<
    string,
    { edge: IAutoMovieDrawingEdge; front: number; back: number }
  >();
  for (const triangle of triangles) {
    const normal = Vector3.cross(
      Vector3.subtract(triangle.b, triangle.a),
      Vector3.subtract(triangle.c, triangle.a),
    );
    if (Vector3.length(normal) <= AUTOMOVIE_DRAWING_EPSILON) continue;
    const front = Vector3.dot(normal, frame.normal) > 0;
    const corners = [triangle.a, triangle.b, triangle.c];
    for (let index = 0; index < 3; ++index) {
      const from = corners[index]!;
      const to = corners[(index + 1) % 3]!;
      const left = key(from);
      const right = key(to);
      if (left === right) continue;
      const id = left < right ? `${left}|${right}` : `${right}|${left}`;
      const current = owners.get(id) ?? {
        edge: { from, to },
        front: 0,
        back: 0,
      };
      if (front) ++current.front;
      else ++current.back;
      owners.set(id, current);
    }
  }
  const edges: IAutoMovieDrawingEdge[] = [];
  for (const entry of owners.values())
    if (entry.front + entry.back === 1 || (entry.front > 0 && entry.back > 0))
      edges.push(entry.edge);
  return edges;
};
