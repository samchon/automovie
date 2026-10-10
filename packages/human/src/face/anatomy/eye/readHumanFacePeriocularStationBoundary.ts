import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";

/**
 * Read adjacent coarse-anchor segments from their one published native cycle.
 * Canonical samples, actual native edges and every anchor offset are checked
 * before reading either winding. No path search or coordinate comparison
 * chooses the course. An unregistered station retains its legacy meaning.
 */
export function readHumanFacePeriocularStationBoundary(
  station: IAutoMovieHumanFacePeriocularStation,
  surface: IAutoMovieHumanFaceBasisSurface,
  anchors: readonly number[],
): number[][] | undefined {
  const boundary = station.boundary;
  if (boundary === undefined) return undefined;
  const { vertices, sourceSamples, anchorOffsets } = boundary;
  const samples = surface.sourcePartition?.samples;
  const n = vertices.length, m = station.vertices.length;
  if (
    boundary.qualification !== "authoredConvention" || n < 3 || m < 3 ||
    samples === undefined || sourceSamples.length !== n ||
    anchorOffsets.length !== m || new Set(vertices).size !== n ||
    new Set(anchorOffsets).size !== m ||
    vertices.some((vertex, at) =>
      !Number.isSafeInteger(vertex) || vertex < 0 ||
      samples[vertex] !== sourceSamples[at]) ||
    anchorOffsets.some((offset, column) =>
      !Number.isSafeInteger(offset) || offset < 0 || offset >= n ||
      vertices[offset] !== station.vertices[column] ||
      sourceSamples[offset] !== station.sourceVertices[column])
  ) throw new Error("A station boundary needs its exact native samples and coarse anchors.");
  const key = (a: number, b: number): string => a < b ? a + ":" + b : b + ":" + a;
  const missing = new Set(vertices.map((vertex, at) =>
    key(vertex, vertices[(at + 1) % n])));
  for (let at = 0; at < surface.indices.length; at += 3)
    for (let corner = 0; corner < 3; corner++)
      missing.delete(key(surface.indices[at + corner], surface.indices[at + (corner + 1) % 3]));
  if (missing.size !== 0)
    throw new Error("A station boundary must retain every actual native edge.");
  const forward = anchorOffsets.reduce((sum, offset, at) =>
    sum + (anchorOffsets[(at + 1) % m] - offset + n) % n, 0);
  const backward = n * m - forward;
  if ((forward === n) === (backward === n))
    throw new Error("A station boundary needs one complete ordered coarse-anchor winding.");
  const winding = forward === n ? 1 : -1;
  const columns = anchors.map((vertex) => station.vertices.indexOf(vertex));
  if (anchors.length < 2 || new Set(anchors).size !== anchors.length || columns.includes(-1))
    throw new Error("A station boundary segment needs distinct registered coarse anchors.");
  return columns.slice(1).map((column, at) => {
    const start = columns[at], step = (column - start + m) % m;
    if (step !== 1 && step !== m - 1)
      throw new Error("A station boundary segment must join adjacent coarse columns.");
    const direction = step === 1 ? winding : -winding;
    const path: number[] = [];
    for (let index = anchorOffsets[start];; index = (index + direction + n) % n) {
      path.push(vertices[index]);
      if (index === anchorOffsets[column]) break;
    }
    return path;
  });
}
