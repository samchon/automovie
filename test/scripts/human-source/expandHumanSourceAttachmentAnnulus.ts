import type { IAutoMovieHumanFacePeriocularAttachmentCharts } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularAttachmentCharts";
import type { IAutoMovieHumanFacePeriocularCage } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularCage";

import { compileHumanSourceAttachmentTriangles } from "./compileHumanSourceAttachmentTriangles.ts";
import { readHumanSourceAttachmentLoops } from "./readHumanSourceAttachmentLoops.ts";
import type { IHumanSourceAttachmentTopology } from "./structures/IHumanSourceAttachmentTopology.ts";

/**
 * Split a widened actual skin annulus through its shared canthal source cuts.
 * Original cuts remain fixed. Their outward extensions are shortest actual
 * edge paths to the new outer boundary, avoiding the old annulus and the
 * other cut. Every old disk triangle must remain on its original side; both
 * components cover the complete annulus and undergo the same disk admission.
 */
export function expandHumanSourceAttachmentAnnulus(
  cage: IAutoMovieHumanFacePeriocularCage,
  indices: readonly number[],
  samples: readonly number[],
  topology: IHumanSourceAttachmentTopology,
  initial: IAutoMovieHumanFacePeriocularAttachmentCharts,
  population: ReadonlySet<number>,
): IAutoMovieHumanFacePeriocularAttachmentCharts {
  const loops = readHumanSourceAttachmentLoops(indices, population);
  const posterior = cage.stations.find(
    (row) => row.role === "posteriorMargin",
  )!;
  const outerStation = cage.stations.find(
    (row) => row.role === "outerAttachment",
  )!;
  if (loops.length !== 2)
    throw new Error("Expanded attachment support is not one actual annulus.");
  const inner = loops.find((loop) =>
    posterior.vertices.every((vertex) => loop.includes(vertex)),
  );
  if (inner === undefined)
    throw new Error(
      "Expanded attachment support changed its posterior source boundary.",
    );
  const outer = new Set(loops.find((loop) => loop !== inner)!);
  const oldUpper = new Set(initial.upper.sourceTriangles),
    oldLower = new Set(initial.lower.sourceTriangles);
  const oldFaces = new Set([...oldUpper, ...oldLower]);
  const oldVertices = new Set([
    ...initial.upper.vertices,
    ...initial.lower.vertices,
  ]);
  const cuts = new Set<string>();
  for (const [edge, faces] of topology.edges) {
    if (
      faces.some((face) => oldUpper.has(face)) &&
      faces.some((face) => oldLower.has(face))
    )
      cuts.add(edge);
  }
  const blocked = new Set<number>();
  for (const column of [cage.medialColumn, cage.lateralColumn]) {
    const start = outerStation.vertices[column],
      queue = [start],
      previous = new Map<number, number>([[start, start]]);
    let end: number | undefined;
    for (let at = 0; at < queue.length; at++) {
      const vertex = queue[at];
      if (outer.has(vertex)) {
        end = vertex;
        break;
      }
      for (const neighbor of topology.vertexNeighbors[vertex]) {
        if (
          previous.has(neighbor) ||
          blocked.has(neighbor) ||
          (neighbor !== start && oldVertices.has(neighbor))
        )
          continue;
        const edge =
          vertex < neighbor ? `${vertex}:${neighbor}` : `${neighbor}:${vertex}`;
        if (
          !topology.edges
            .get(edge)!
            .some(
              (triangle) => population.has(triangle) && !oldFaces.has(triangle),
            )
        )
          continue;
        previous.set(neighbor, vertex);
        queue.push(neighbor);
      }
    }
    if (end === undefined)
      throw new Error(
        "Expanded annulus lacks an uncrossed canthal source path.",
      );
    let vertex = end;
    blocked.add(vertex);
    while (vertex !== start) {
      const parent = previous.get(vertex)!;
      cuts.add(vertex < parent ? `${vertex}:${parent}` : `${parent}:${vertex}`);
      vertex = parent;
      blocked.add(vertex);
    }
  }
  const component = (seed: number): Set<number> => {
    const found = new Set<number>([seed]),
      queue = [seed];
    for (let at = 0; at < queue.length; at++)
      for (let corner = 0; corner < 3; corner++) {
        const a = indices[3 * queue[at] + corner],
          b = indices[3 * queue[at] + ((corner + 1) % 3)];
        const edge = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (cuts.has(edge)) continue;
        for (const neighbor of topology.edges.get(edge)!)
          if (population.has(neighbor) && !found.has(neighbor)) {
            found.add(neighbor);
            queue.push(neighbor);
          }
      }
    return found;
  };
  const above = component(initial.upper.sourceTriangles[0]),
    below = component(initial.lower.sourceTriangles[0]);
  if (
    [...above].some((face) => below.has(face)) ||
    [...oldUpper].some((face) => !above.has(face)) ||
    [...oldLower].some((face) => !below.has(face)) ||
    above.size + below.size !== population.size
  )
    throw new Error(
      "Expanded canthal cuts do not preserve two complete disjoint original lid domains.",
    );
  return {
    upper: compileHumanSourceAttachmentTriangles(
      cage.generation,
      cage.surface,
      indices,
      samples,
      [...above],
    ),
    lower: compileHumanSourceAttachmentTriangles(
      cage.generation,
      cage.surface,
      indices,
      samples,
      [...below],
    ),
  };
}
