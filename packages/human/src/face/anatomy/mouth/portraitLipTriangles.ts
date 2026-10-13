import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { portraitMouthInnerLoop } from "./structures/portraitMouthInnerLoop";

/**
 * Select the connected vermilion band by its two anatomical boundary loops. Flooding from the socket's interior seed may cross an internal triangulation edge but may never cross the outer lip or mouth rim. This preserves the authored contour after subdivision; a centroid-in-polygon paint test can select half of a boundary quad and produce a jagged lip edge. Returned identities are triangle numbers in the supplied connectivity.
 *
 * @evidence contracts/common.md#principled-implementation Incident-edge flooding from the socket seed selects the connected band without crossing outer or inner barriers.
 * @evidence contracts/common.md#clear-and-simple-design Topology identity governs material and performance ownership after subdivision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The socket/buffer topology is an admitted premise; an absent seed refuses and the selector does not prove global anatomical correctness.
 * @evidence contracts/common.md#meaningful-documentation Returned numbers are original triangle ordinals in the supplied connectivity.
 * @evidence contracts/performance.md#efficient-algorithms Edge indexing and queue flood are O(triangles plus incidence) with map/set lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work One adjacency table and barrier set serve every visited face; selected membership prevents repeated enqueues.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned ordinal set is owned; edge maps and queue are local and caller connectivity remains unchanged.
 */
export function portraitLipTriangles(
  triangles: number[],
  socket: IPortraitMouthSocket,
): Set<number> {
  const edgeKey: (a: number, b: number) => string = (a: number, b: number): string =>
    `${Math.min(a, b)}/${Math.max(a, b)}`;
  const barriers: Set<string> = new Set<string>();
  for (const loop of [socket.outer, portraitMouthInnerLoop(socket)])
    for (let i: number = 0; i < loop.length; i++)
      barriers.add(edgeKey(loop[i], loop[(i + 1) % loop.length]));
  const incident: Map<string, number[]> = new Map<string, number[]>();
  const faceEdges: string[][] = [];
  let seed: number = -1;
  for (let i: number = 0; i < triangles.length; i += 3) {
    const face: number[] = triangles.slice(i, i + 3);
    if (face.includes(socket.lipSeed)) seed = i / 3;
    const edges: string[] = face.map((a: number, j: number): string => edgeKey(a, face[(j + 1) % 3]));
    faceEdges.push(edges);
    for (const edge of edges) {
      const neighbours: number[] | undefined = incident.get(edge);
      if (neighbours === undefined) incident.set(edge, [i / 3]);
      else neighbours.push(i / 3);
    }
  }
  if (seed < 0)
    throw new Error("The lip control cage must include its interior seed.");
  const selected: Set<number> = new Set<number>([seed]);
  const queue: number[] = [seed];
  for (let i: number = 0; i < queue.length; i++)
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
