import {
  type IAutoMovieDrawingEdge,
  IAutoMovieDrawingFrame,
  type IAutoMovieDrawingTriangle,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineDrawingEpsilon } from "../AutoMovieEngineDrawingEpsilon";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/*
 * Silhouette of a triangle soup under the view's orthographic direction.
 *
 * An edge is drawn when the faces meeting along it disagree about facing the
 * viewer, or when only one face owns it. A face's facing is the sign of its
 * winding normal against the frame normal, and an edge-on face counts as facing
 * away, which is what makes a plan of an upright box its four top edges: the
 * top faces the viewer, the walls are edge-on, and the disagreement along each
 * top edge is the outline. Degenerate triangles are skipped.
 *
 * Corners are welded on the rounded output grid before edges are keyed, so two
 * triangles meeting at one corner are recognised as meeting there even when the
 * arithmetic that produced it differed in a last bit. Two corners closer than
 * the grid but on opposite sides of a rounding boundary are not welded.
 * Parameter frame: Page basis whose normal points back at the viewer.
 * Parameter triangles: World triangles of one drawable, in their source winding.
 * Returns: One world edge per silhouette or border edge, in first-seen order.
 */
export const autoMovieDrawingSilhouetteEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const key = (point: IAutoMovieVector3): string =>
    `${roundAutoMovieDrawingScalar(point.x)},${roundAutoMovieDrawingScalar(point.y)},${roundAutoMovieDrawingScalar(point.z)}`;
  const owners: Map<string, IEdgeOwners> = new Map();
  for (const triangle of triangles) {
    const normal: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
      AutoMovieEngineVector3.subtract(triangle.b, triangle.a),
      AutoMovieEngineVector3.subtract(triangle.c, triangle.a),
    );
    if (AutoMovieEngineVector3.length(normal) <= AutoMovieEngineDrawingEpsilon) continue;
    const front: boolean = AutoMovieEngineVector3.dot(normal, frame.normal) > 0;
    const corners: IAutoMovieVector3[] = [triangle.a, triangle.b, triangle.c];
    const keys: string[] = corners.map(key);
    for (let index: number = 0; index < 3; ++index) {
      const left: string = keys[index]!;
      const right: string = keys[(index + 1) % 3]!;
      if (left === right) continue;
      const id: string = left < right ? `${left}|${right}` : `${right}|${left}`;
      let current: IEdgeOwners | undefined = owners.get(id);
      if (current === undefined) {
        current = {
          edge: { from: corners[index]!, to: corners[(index + 1) % 3]! },
          front: 0,
          back: 0,
        };
        owners.set(id, current);
      }
      if (front) ++current.front;
      else ++current.back;
    }
  }
  const edges: IAutoMovieDrawingEdge[] = [];
  for (const entry of owners.values())
    if (entry.front + entry.back === 1 || (entry.front > 0 && entry.back > 0))
      edges.push(entry.edge);
  return edges;
};

/*
 * How many triangles facing toward and away from the viewer share one edge.
 */
interface IEdgeOwners {
  edge: IAutoMovieDrawingEdge;
  front: number;
  back: number;
}
