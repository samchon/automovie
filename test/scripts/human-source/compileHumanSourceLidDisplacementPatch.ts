import type { IAutoMovieHumanFacePeriocularDisplacementPatch } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularDisplacementPatch";

import { readHumanSourceAttachmentLoops } from "./readHumanSourceAttachmentLoops.ts";
import { readHumanSourceAttachmentTopology } from "./readHumanSourceAttachmentTopology.ts";
import { readHumanSourceNativeEdgeCycle } from "./readHumanSourceNativeEdgeCycle.ts";
import type { IHumanSourceLidDisplacementPatchInput } from "./structures/IHumanSourceLidDisplacementPatchInput.ts";

/**
 * Register the actual annulus between authored posterior and preseptal rows.
 * Each closed anchor row follows deterministic shortest edge-count paths,
 * excluding other anchors, interior stations and previously occupied paths.
 * Cutting both edge cycles selects the face component containing every
 * interior station. Oriented incidence, both complete boundaries, connected
 * vertex links and Euler characteristic zero admit that native annulus.
 * Geometry, expanded material disks and clinical distances select no faces.
 */
export function compileHumanSourceLidDisplacementPatch(
  input: IHumanSourceLidDisplacementPatchInput,
): IAutoMovieHumanFacePeriocularDisplacementPatch {
  const {
    indices,
    samples,
    posteriorStations,
    preseptalStations,
    interiorStations,
  } = input;
  const topology = readHumanSourceAttachmentTopology(indices, samples.length);
  const anchors = [...posteriorStations, ...preseptalStations];
  if (
    posteriorStations.length < 3 ||
    posteriorStations.length !== preseptalStations.length ||
    new Set(anchors).size !== anchors.length ||
    interiorStations.length === 0
  )
    throw new Error(
      "Lid movement needs two distinct complete closed station rows and interior witnesses.",
    );
  if (
    [...anchors, ...interiorStations].some(
      (vertex) =>
        !Number.isSafeInteger(vertex) ||
        topology.vertexFaces[vertex]?.size === 0 ||
        samples[vertex] === undefined,
    )
  )
    throw new Error(
      "Lid movement station is absent from the actual native incidence.",
    );
  const forbidden = new Set([...anchors, ...interiorStations]),
    occupied = new Set<number>();
  const key = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  const cuts = new Set<string>();
  const trace = (stations: readonly number[]): number[] => {
    const cycle = readHumanSourceNativeEdgeCycle({ topology, stations, forbidden, occupied });
    for (let at = 0; at < cycle.length; at++)
      cuts.add(key(cycle[at], cycle[(at + 1) % cycle.length]));
    return cycle;
  };
  const posterior = trace(posteriorStations),
    preseptal = trace(preseptalStations);
  const witness = interiorStations[0];
  const seeds = [...topology.vertexFaces[witness]];
  const population = new Set<number>([seeds[0]]),
    queue = [seeds[0]];
  for (let at = 0; at < queue.length; at++)
    for (let corner = 0; corner < 3; corner++) {
      const a = indices[3 * queue[at] + corner],
        b = indices[3 * queue[at] + ((corner + 1) % 3)];
      if (cuts.has(key(a, b))) continue;
      for (const near of topology.edges.get(key(a, b))!)
        if (!population.has(near)) {
          population.add(near);
          queue.push(near);
        }
    }
  if (
    interiorStations.some((vertex) =>
      [...topology.vertexFaces[vertex]].some(
        (triangle) => !population.has(triangle),
      ),
    )
  )
    throw new Error(
      "Lid movement boundaries do not enclose every complete interior station fan.",
    );
  const loops = readHumanSourceAttachmentLoops(indices, population);
  const same = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length && a.every((vertex) => b.includes(vertex));
  const posteriorBoundary = loops.find((loop) => same(loop, posterior));
  const preseptalBoundary = loops.find((loop) => same(loop, preseptal));
  if (
    loops.length !== 2 ||
    posteriorBoundary === undefined ||
    preseptalBoundary === undefined
  )
    throw new Error(
      "Lid movement population is not bounded by exactly its two registered native cycles.",
    );
  const vertices = new Set<number>(),
    edges = new Set<string>();
  for (const triangle of population)
    for (let corner = 0; corner < 3; corner++) {
      const a = indices[3 * triangle + corner],
        b = indices[3 * triangle + ((corner + 1) % 3)];
      vertices.add(a);
      edges.add(key(a, b));
    }
  if (vertices.size - edges.size + population.size !== 0)
    throw new Error(
      "Lid movement native population has non-annular Euler characteristic.",
    );
  for (const vertex of vertices) {
    const incident = [...topology.vertexFaces[vertex]].filter((triangle) =>
      population.has(triangle),
    );
    const seen = new Set([incident[0]]),
      pending = [incident[0]];
    for (let at = 0; at < pending.length; at++)
      for (const near of topology.faceNeighbors[pending[at]])
        if (
          population.has(near) &&
          topology.vertexFaces[vertex].has(near) &&
          !seen.has(near)
        ) {
          seen.add(near);
          pending.push(near);
        }
    if (seen.size !== incident.length)
      throw new Error("Lid movement native vertex link is disconnected.");
  }
  return {
    generation: input.generation,
    surface: input.surface,
    triangles: [...population].sort((a, b) => a - b),
    posteriorBoundary,
    preseptalBoundary,
    posteriorSamples: posteriorBoundary.map((vertex) => samples[vertex]),
    preseptalSamples: preseptalBoundary.map((vertex) => samples[vertex]),
    qualification: "authoredConvention",
  };
}
