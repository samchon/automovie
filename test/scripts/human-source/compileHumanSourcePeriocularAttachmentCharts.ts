import type { IAutoMovieHumanFacePeriocularAttachmentCharts } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularAttachmentCharts";
import type { IAutoMovieHumanFacePeriocularStation } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularStation";

import { compileHumanSourceAttachmentChart } from "./compileHumanSourceAttachmentChart.ts";

/**
 * Register both material disks and admit their actual shared canthal cuts.
 * Their triangle populations must be disjoint. The common physical vertices
 * and edges must form exactly two nonbranching paths containing all registered
 * medial and lateral radial stations respectively. This checks assembly at
 * the source boundary instead of assuming independent disk solves agree.
 */
export function compileHumanSourcePeriocularAttachmentCharts(
  generation: string,
  surface: string,
  indices: readonly number[],
  samples: readonly number[],
  stations: readonly IAutoMovieHumanFacePeriocularStation[],
  upperColumns: readonly number[],
  lowerColumns: readonly number[],
): IAutoMovieHumanFacePeriocularAttachmentCharts {
  const upper = compileHumanSourceAttachmentChart(generation, surface, indices, samples, stations, upperColumns);
  const lower = compileHumanSourceAttachmentChart(generation, surface, indices, samples, stations, lowerColumns);
  const upperFaces = new Set(upper.sourceTriangles);
  if (lower.sourceTriangles.some((triangle) => upperFaces.has(triangle)))
    throw new Error("Periocular material disks overlap in actual host triangles.");
  const upperVertices = new Set(upper.vertices), shared = lower.vertices.filter((vertex) => upperVertices.has(vertex));
  const graph = new Map(shared.map((vertex) => [vertex, new Set<number>()]));
  const key = (a: number, b: number): string => a < b ? `${a}:${b}` : `${b}:${a}`;
  const edgeCounts = (triangles: readonly number[]): Map<string, number> => {
    const result = new Map<string, number>();
    for (const triangle of triangles) for (let corner = 0; corner < 3; corner++) {
      const a = indices[3 * triangle + corner], b = indices[3 * triangle + (corner + 1) % 3];
      if (graph.has(a) && graph.has(b)) {
        const id = key(a, b); result.set(id, (result.get(id) ?? 0) + 1);
      }
    }
    return result;
  };
  const above = edgeCounts(upper.sourceTriangles), below = edgeCounts(lower.sourceTriangles);
  for (const [id, count] of above) {
    if (below.get(id) === undefined) continue;
    if (count !== 1 || below.get(id) !== 1) throw new Error("Shared canthal path is not both disks' boundary.");
    const [a, b] = id.split(":").map(Number); graph.get(a)!.add(b); graph.get(b)!.add(a);
  }
  if ([...graph.values()].some((neighbors) => neighbors.size < 1 || neighbors.size > 2))
    throw new Error("Shared canthal attachment paths are incomplete or branched.");
  const components: Set<number>[] = [], visited = new Set<number>();
  for (const vertex of shared) {
    if (visited.has(vertex)) continue;
    const component = new Set<number>([vertex]), queue = [vertex]; visited.add(vertex);
    for (let at = 0; at < queue.length; at++) for (const neighbor of graph.get(queue[at])!)
      if (!visited.has(neighbor)) { visited.add(neighbor); component.add(neighbor); queue.push(neighbor); }
    if ([...component].filter((point) => graph.get(point)!.size === 1).length !== 2)
      throw new Error("Shared canthal attachment component is not a simple path.");
    components.push(component);
  }
  if (components.length !== 2 || [upperColumns[0], upperColumns.at(-1)!].some((column) =>
    !components.some((component) => stations.every((station) => component.has(station.vertices[column])))))
    throw new Error("Periocular disks do not share both complete registered canthal paths.");
  return { upper, lower };
}
