import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { portraitMouthInnerLoop } from "./structures/portraitMouthInnerLoop";

/**
 * Select the connected vermilion band by its two anatomical boundary loops.
 * Flooding from the socket's interior seed may cross an
 * internal triangulation edge but may never cross the outer lip or mouth rim.
 * This preserves the authored contour after subdivision; a centroid-in-polygon
 * paint test can select half of a boundary quad and produce a jagged lip edge.
 * Returned identities are triangle numbers in the supplied connectivity.
 *
 * @evidence contracts/common.md#principled-implementation The vermilion band is the connected set of triangles reachable from the seed without crossing an edge of the outer loop or the aperture loop: a flood fill over the triangle adjacency graph with the two boundary loops as barriers. That is a topological definition, so it stays exact after subdivision, where a centroid-in-polygon test would take half a boundary quad.
 * @evidence contracts/common.md#clear-and-simple-design One pass builds the edge index and one flood selects the band.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinates or subject identities are used; the barriers are the socket's own loops.
 * @evidence contracts/common.md#meaningful-documentation The comment states the barriers, why flooding replaces a centroid test and what the returned identities are.
 * @evidence contracts/modeling.md#spatial-conventions Inputs and outputs are vertex and triangle identities; no unit or frame is involved.
 * @evidence contracts/modeling.md#part-identity-and-grouping The function selects the lips, one part of the face, by their two boundary loops and composes nothing.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It selects the band from exactly the two loops the socket shares with the skin and the aperture, so the material ownership follows the same boundaries the geometry does; a seed outside the cage is refused and a loop that is not closed in the cage would let the flood escape.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint; the selected band is observed under the mouth component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 */
export function portraitLipTriangles(
  triangles: number[],
  socket: IPortraitMouthSocket,
): Set<number> {
  const edgeKey = (a: number, b: number): string =>
    `${Math.min(a, b)}/${Math.max(a, b)}`;
  const barriers = new Set<string>();
  for (const loop of [socket.outer, portraitMouthInnerLoop(socket)])
    for (let i = 0; i < loop.length; i++)
      barriers.add(edgeKey(loop[i], loop[(i + 1) % loop.length]));
  const incident = new Map<string, number[]>();
  const faceEdges: string[][] = [];
  let seed = -1;
  for (let i = 0; i < triangles.length; i += 3) {
    const face = triangles.slice(i, i + 3);
    if (face.includes(socket.lipSeed)) seed = i / 3;
    const edges = face.map((a, j) => edgeKey(a, face[(j + 1) % 3]));
    faceEdges.push(edges);
    for (const edge of edges) {
      const neighbours = incident.get(edge);
      if (neighbours === undefined) incident.set(edge, [i / 3]);
      else neighbours.push(i / 3);
    }
  }
  if (seed < 0)
    throw new Error("The lip control cage must include its interior seed.");
  const selected = new Set<number>([seed]);
  const queue = [seed];
  for (let i = 0; i < queue.length; i++)
    for (const edge of faceEdges[queue[i]]) {
      if (barriers.has(edge)) continue;
      for (const neighbour of incident.get(edge)!)
        if (!selected.has(neighbour)) {
          selected.add(neighbour);
          queue.push(neighbour);
        }
    }
  return selected;
}
