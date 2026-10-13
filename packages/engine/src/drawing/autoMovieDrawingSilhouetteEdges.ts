import {
  IAutoMovieDrawingFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieDrawingEdge } from "./IAutoMovieDrawingEdge";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/** How many triangles facing toward and away from the viewer share one edge. */
interface IEdgeOwners {
  edge: IAutoMovieDrawingEdge;
  front: number;
  back: number;
}

/**
 * Silhouette of a triangle soup under the view's orthographic direction.
 *
 * An edge is drawn when the faces meeting along it disagree about facing the
 * viewer, or when only one face owns it. A face's facing is the sign of its
 * winding normal against the frame normal, and an edge-on face counts as
 * facing away, which is what makes a plan of an upright box its four top
 * edges: the top faces the viewer, the walls are edge-on, and the disagreement
 * along each top edge is the outline. Degenerate triangles are skipped.
 *
 * Corners are welded on the rounded output grid before edges are keyed, so two
 * triangles meeting at one corner are recognised as meeting there even when
 * the arithmetic that produced it differed in a last bit. Two corners closer
 * than the grid but on opposite sides of a rounding boundary are not welded.
 *
 * @param frame Page basis whose normal points back at the viewer.
 * @param triangles World triangles of one drawable, in their source winding.
 * @returns One world edge per silhouette or border edge, in first-seen order.
 *
 * @evidence contracts/common.md#principled-implementation The standard polygon-mesh silhouette rule, a front-facing and a back-facing face sharing an edge, plus boundary edges owned once, with facing from the right-hand winding normal that `IAutoMovieDrawingTriangle` defines; welding on the six-decimal output grid is the stated limitation, since two nearly equal corners straddling a rounding boundary stay distinct.
 * @evidence contracts/common.md#clear-and-simple-design One function owns facing, welding and the edge verdict; the owner tally is a private record because no other pass reads it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element or view is special-cased; edge-on faces fall to the away side by the facing test's strict inequality, which is the documented drafting convention rather than a fixture fix.
 * @evidence contracts/common.md#meaningful-documentation The comment states the edge rule, the facing definition and the edge-on convention with its effect, the welding rule and its limitation, the skipped degenerate faces, and the output order.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `t` triangles with a hash map keyed by welded edge, so time and space are linear in `t`; each triangle builds its three corner keys once and reuses them for its three edges, and the map is needed because an edge's verdict depends on every triangle sharing it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per drawable and role per derivation; the welding map serves only that call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner map is created per call, grows to at most three entries per triangle, and is released when the call returns; only the returned edge array, owned by the caller, survives.
 * @author Samchon
 */
export const autoMovieDrawingSilhouetteEdges = (
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingEdge[] => {
  const key = (point: IAutoMovieVector3): string =>
    `${roundAutoMovieDrawingScalar(point.x)},${roundAutoMovieDrawingScalar(point.y)},${roundAutoMovieDrawingScalar(point.z)}`;
  const owners: Map<string, IEdgeOwners> = new Map();
  for (const triangle of triangles) {
    const normal: IAutoMovieVector3 = Vector3.cross(
      Vector3.subtract(triangle.b, triangle.a),
      Vector3.subtract(triangle.c, triangle.a),
    );
    if (Vector3.length(normal) <= AUTOMOVIE_DRAWING_EPSILON) continue;
    const front: boolean = Vector3.dot(normal, frame.normal) > 0;
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
