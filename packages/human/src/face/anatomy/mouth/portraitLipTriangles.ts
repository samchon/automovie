import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { innerLoop } from "./structures/innerLoop";

/**
 * Select the connected vermilion band by its two anatomical boundary loops.
 * Flooding from the socket's interior seed may cross an
 * internal triangulation edge but may never cross the outer lip or mouth rim.
 * This preserves the authored contour after subdivision; a centroid-in-polygon
 * paint test can select half of a boundary quad and produce a jagged lip edge.
 * Returned identities are triangle numbers in the supplied connectivity.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Keeps the vermilion material bound to the complete connected anatomical band.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Floods triangle adjacency from an interior seed while treating both outer lip and inner mouth loops as uncrossable barriers.
 */
export function portraitLipTriangles(
  triangles: number[],
  socket: IPortraitMouthSocket,
): Set<number> {
  const edgeKey = (a: number, b: number): string =>
    `${Math.min(a, b)}/${Math.max(a, b)}`;
  const barriers = new Set<string>();
  for (const loop of [socket.outer, innerLoop(socket)])
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
