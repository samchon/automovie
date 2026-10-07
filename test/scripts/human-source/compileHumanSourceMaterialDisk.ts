import type { IAutoMovieHumanFaceAttachmentChart } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentChart";

import { compileHumanSourceAttachmentTriangles } from "./compileHumanSourceAttachmentTriangles.ts";
import { readHumanSourceAttachmentTopology } from "./readHumanSourceAttachmentTopology.ts";

/**
 * Register one source-native disk containing every requested anchor's star.
 * The mesh grows by elementary triangle shelling: one boundary edge with a
 * new opposite vertex, or two consecutive boundary edges. Each attachment
 * preserves a manifold disk, rather than projecting curved skin onto a plane.
 * Dual-graph distance to the next missing source face orders eligible shells;
 * it changes preparation cost, never source positions or material identity.
 *
 * Complete stars of source-interior anchors remain interior coordinates;
 * a source-boundary anchor retains its boundary status. An unsupported greedy
 * shelling refuses instead of cutting aliases, filling an
 * anatomical hole or changing the source. The existing disk parameterizer
 * independently checks incidence and positive orientation before publication.
 * Coordinates are dimensionless, with physical metrics left to the consumer.
 */
export function compileHumanSourceMaterialDisk(
  generation: string,
  surface: string,
  indices: readonly number[],
  samples: readonly number[],
  anchors: readonly number[],
): IAutoMovieHumanFaceAttachmentChart {
  const topology = readHumanSourceAttachmentTopology(indices, samples.length);
  if (
    anchors.length === 0 ||
    anchors.some((vertex) => topology.vertexFaces[vertex]?.size === undefined ||
      topology.vertexFaces[vertex].size === 0)
  )
    throw new Error("Material disk needs resident native anchor incidence.");
  const required = [...new Set(anchors.flatMap((vertex) =>
    [...topology.vertexFaces[vertex]],
  ))];
  const selected = new Set<number>();
  const vertices = new Set<number>();
  const edges = new Map<string, number>();
  const frontier = new Set<number>();
  const key = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  const add = (face: number): void => {
    selected.add(face);
    frontier.delete(face);
    const corners = indices.slice(3 * face, 3 * face + 3);
    for (let corner = 0; corner < 3; corner++) {
      vertices.add(corners[corner]);
      const id = key(corners[corner], corners[(corner + 1) % 3]);
      edges.set(id, (edges.get(id) ?? 0) + 1);
    }
    for (const neighbor of topology.faceNeighbors[face])
      if (!selected.has(neighbor)) frontier.add(neighbor);
  };
  const eligible = (face: number): boolean => {
    const corners = indices.slice(3 * face, 3 * face + 3);
    const counts = corners.map((vertex, corner) =>
      edges.get(key(vertex, corners[(corner + 1) % 3])) ?? 0,
    );
    if (counts.includes(2)) return false;
    const shared = counts.filter((count) => count === 1).length;
    return shared === 2 ||
      (shared === 1 && corners.filter((vertex) => vertices.has(vertex)).length === 2);
  };
  add(required[0]);
  for (const target of required) {
    if (selected.has(target)) continue;
    const distance = new Int32Array(topology.faceNeighbors.length).fill(-1);
    distance[target] = 0;
    const queue = [target];
    for (let at = 0; at < queue.length; at++)
      for (const neighbor of topology.faceNeighbors[queue[at]])
        if (distance[neighbor] === -1) {
          distance[neighbor] = distance[queue[at]] + 1;
          queue.push(neighbor);
        }
    while (!selected.has(target)) {
      let candidate: number | undefined;
      for (const face of frontier)
        if (distance[face] >= 0 && eligible(face) &&
          (candidate === undefined || distance[face] < distance[candidate] ||
            (distance[face] === distance[candidate] && face < candidate)))
          candidate = face;
      if (candidate === undefined)
        throw new Error("Native anchor stars cannot share one shellable material disk.");
      add(candidate);
    }
  }
  return compileHumanSourceAttachmentTriangles(
    generation, surface, indices, samples, [...selected],
  );
}
