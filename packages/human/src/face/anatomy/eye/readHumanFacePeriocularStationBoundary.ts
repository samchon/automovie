import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";

/**
 * Read adjacent coarse-anchor segments from their one published native cycle.
 * Canonical samples, actual native edges and every anchor offset are checked
 * before reading either winding. No path search or coordinate comparison
 * chooses the course. An unregistered station retains its legacy meaning.
 *
 * @evidence contracts/common.md#principled-implementation Exact source samples and native edge incidence admit the published cycle; the complete coarse anchor order determines its winding.
 * @evidence contracts/common.md#clear-and-simple-design One reader supplies the same native segments to tissue and shaft consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest path, coordinate weld or anatomical-axis choice replaces the source boundary.
 * @evidence contracts/common.md#meaningful-documentation States source checks, winding and legacy omission.
 * @evidence contracts/modeling.md#shared-boundaries Returns the actual published skin vertices, including every native knot.
 * @evidence contracts/modeling.md#spatial-conventions All values are native vertex, canonical sample or coarse column ordinals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads an existing station boundary.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Attached consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The publisher owns the authored turning-border qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Adds no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal control.
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
