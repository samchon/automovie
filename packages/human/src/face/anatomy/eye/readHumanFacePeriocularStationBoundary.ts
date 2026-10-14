import type { IAutoMovieHumanFacePeriocularStationBoundary } from "../../structures/IAutoMovieHumanFacePeriocularStationBoundary";

import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";

/**
 * Read adjacent coarse-anchor segments from their one published native cycle.
 * Canonical samples, actual native edges and every anchor offset are checked
 * before reading either winding. No path search or coordinate comparison
 * chooses the course. An unregistered station retains its legacy meaning.
 *
 * @evidence contracts/common.md#principled-implementation Exact canonical samples, resident native edges and a unique complete coarse-anchor winding admit the published cycle before extracting adjacent segments.
 * @evidence contracts/common.md#clear-and-simple-design The publisher owns cycle incidence; this reader selects existing paths without spatial path search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered stations return legacy absence; incompatible samples/edges/anchors refuse rather than choosing a coordinate-nearest course.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies registered incidence checks, winding and legacy optional meaning.
 * @evidence contracts/performance.md#efficient-algorithms Native triangle-edge scan, cycle/anchor admission and emitted segment traversal dominate; anchor lookup currently scans coarse station identities.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted winding/native cycle serves all requested adjacent-anchor paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned segment arrays own their ordinals; edge/column lookup tables expire and source geometry remains unchanged.
 */
export function readHumanFacePeriocularStationBoundary(
  station: IAutoMovieHumanFacePeriocularStation,
  surface: IAutoMovieHumanFaceBasisSurface,
  anchors: readonly number[],
): number[][] | undefined {
  const boundary: IAutoMovieHumanFacePeriocularStationBoundary | undefined = station.boundary;
  if (boundary === undefined) return undefined;
  const { vertices, sourceSamples, anchorOffsets }: IAutoMovieHumanFacePeriocularStationBoundary = boundary;
  const samples: readonly number[] | undefined = surface.sourcePartition?.samples;
  const n: number = vertices.length, m: number = station.vertices.length;
  if (
    boundary.qualification !== "authoredConvention" || n < 3 || m < 3 ||
    samples === undefined || sourceSamples.length !== n ||
    anchorOffsets.length !== m || new Set(vertices).size !== n ||
    new Set(anchorOffsets).size !== m ||
    vertices.some((vertex: number, at: number): boolean  =>
      !Number.isSafeInteger(vertex) || vertex < 0 ||
      samples[vertex] !== sourceSamples[at]) ||
    anchorOffsets.some((offset: number, column: number): boolean  =>
      !Number.isSafeInteger(offset) || offset < 0 || offset >= n ||
      vertices[offset] !== station.vertices[column] ||
      sourceSamples[offset] !== station.sourceVertices[column])
  ) throw new Error("A station boundary needs its exact native samples and coarse anchors.");
  const key: (a: number, b: number) => string = (a: number, b: number): string => a < b ? a + ":" + b : b + ":" + a;
  const missing: Set<string> = new Set(vertices.map((vertex: number, at: number): string  =>
    key(vertex, vertices[(at + 1) % n])));
  for (let at: number = 0; at < surface.indices.length; at += 3)
    for (let corner: number = 0; corner < 3; corner++)
      missing.delete(key(surface.indices[at + corner], surface.indices[at + (corner + 1) % 3]));
  if (missing.size !== 0)
    throw new Error("A station boundary must retain every actual native edge.");
  const forward: number = anchorOffsets.reduce((sum: number, offset: number, at: number): number  =>
    sum + (anchorOffsets[(at + 1) % m] - offset + n) % n, 0);
  const backward: number = n * m - forward;
  if ((forward === n) === (backward === n))
    throw new Error("A station boundary needs one complete ordered coarse-anchor winding.");
  const winding: 1 | -1 = forward === n ? 1 : -1;
  const columns: number[] = anchors.map((vertex: number): number  => station.vertices.indexOf(vertex));
  if (anchors.length < 2 || new Set(anchors).size !== anchors.length || columns.includes(-1))
    throw new Error("A station boundary segment needs distinct registered coarse anchors.");
  return columns.slice(1).map((column: number, at: number): number[]  => {
    const start: number = columns[at], step: number = (column - start + m) % m;
    if (step !== 1 && step !== m - 1)
      throw new Error("A station boundary segment must join adjacent coarse columns.");
    const direction: number = step === 1 ? winding : -winding;
    const path: number[] = [];
    for (let index: number = anchorOffsets[start];; index = (index + direction + n) % n) {
      path.push(vertices[index]);
      if (index === anchorOffsets[column]) break;
    }
    return path;
  });
}
