import { Vector3 } from "@automovie/engine";
import type { IAutoMovieHumanFaceAttachmentContinuation } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentContinuation";

import { compileHumanSourcePeriocularAttachmentCharts } from "./compileHumanSourcePeriocularAttachmentCharts.ts";
import { closeHumanSourceAttachmentAnnulus } from "./closeHumanSourceAttachmentAnnulus.ts";
import { expandHumanSourceAttachmentAnnulus } from "./expandHumanSourceAttachmentAnnulus.ts";
import { readHumanSourceAttachmentLoops } from "./readHumanSourceAttachmentLoops.ts";
import { readHumanSourceAttachmentTopology } from "./readHumanSourceAttachmentTopology.ts";
import { traceHumanSourceOcularContinuation } from "./traceHumanSourceOcularContinuation.ts";
import type { IHumanSourceAttachmentCoverage } from "./structures/IHumanSourceAttachmentCoverage.ts";
import type { IHumanSourceAttachmentExtension } from "./structures/IHumanSourceAttachmentExtension.ts";
import type { IHumanSourceAttachmentExtensionInput } from "./structures/IHumanSourceAttachmentExtensionInput.ts";

/**
 * Compile all registered lid extents against the actual consumer reference.
 * The coarse outer station is a correspondence row, not the hidden tarsal far
 * border. Every unsupported extent receives an actual source meridian section
 * continuation. The whole annulus is widened by the minimum dual-graph depth
 * covering those cuts and their incident material triangles; the metric
 * target determines that depth, never a fixed number of rings or millimetres.
 * Original coordinates, weights, extents and canthal station identities stay
 * unchanged. The wider domain is source attachment metadata, not tissue fit.
 */
export function extendHumanSourcePeriocularAttachmentCharts(input: IHumanSourceAttachmentExtensionInput): IHumanSourceAttachmentExtension {
  const { host, cage, reference, exterior } = input;
  const samples = host.sourcePartition?.samples;
  if (samples === undefined || reference.length !== host.positions.length || reference.some((value) => !Number.isFinite(value)))
    throw new Error("Attachment support needs the complete same-source prepared reference.");
  const initial = compileHumanSourcePeriocularAttachmentCharts(cage.generation, cage.surface, host.indices, samples, cage.stations, cage.upperColumns, cage.lowerColumns);
  const annulus = new Set([...initial.upper.sourceTriangles, ...initial.lower.sourceTriangles]);
  const loops = readHumanSourceAttachmentLoops(host.indices, annulus);
  const outer = cage.stations.find((station) => station.role === "outerAttachment");
  const posterior = cage.stations.find((station) => station.role === "posteriorMargin");
  if (outer === undefined || posterior === undefined || loops.length !== 2)
    throw new Error("Attachment source stations do not enclose a coarse annulus.");
  const outerLoop = loops.find((loop) => outer.vertices.every((vertex) => loop.includes(vertex)));
  if (outerLoop === undefined) throw new Error("Coarse outer station is not the actual annulus outer boundary.");
  const topology = readHumanSourceAttachmentTopology(host.indices, samples.length);
  const depths = new Map<number, number>(), queue: number[] = [];
  for (let at = 0; at < outerLoop.length; at++) {
    const a = outerLoop[at], b = outerLoop[(at + 1) % outerLoop.length], key = a < b ? `${a}:${b}` : `${b}:${a}`;
    for (const face of topology.edges.get(key) ?? []) if (!annulus.has(face) && !depths.has(face)) { depths.set(face, 0); queue.push(face); }
  }
  for (let at = 0; at < queue.length; at++) for (const neighbor of topology.faceNeighbors[queue[at]])
    if (!annulus.has(neighbor) && !depths.has(neighbor)) { depths.set(neighbor, depths.get(queue[at])! + 1); queue.push(neighbor); }
  const excluded = new Set(Array.from({ length: host.indices.length / 3 }, (_, triangle) => triangle).filter((triangle) => !depths.has(triangle)));
  const coverage: IHumanSourceAttachmentCoverage[] = [];
  const continuations: Record<"upper" | "lower", IAutoMovieHumanFaceAttachmentContinuation[]> = { upper: [], lower: [] };
  let requiredDepth = -1;
  const arc = (vertex: number): number => exterior.meridianArc(exterior.project(Vector3.create(...reference.slice(3 * vertex, 3 * vertex + 3))).point);
  for (const lid of ["upper", "lower"] as const) {
    const columns = lid === "upper" ? cage.upperColumns : cage.lowerColumns;
    const extents = lid === "upper" ? cage.tarsalExtent?.upperArcMetres : cage.tarsalExtent?.lowerArcMetres;
    if (extents === undefined || extents.length !== columns.length) throw new Error("Source support requires its unchanged registered tarsal arc extents.");
    for (let at = 0; at < columns.length; at++) {
      const column = columns[at], stationArcs = cage.stations.map((station) => arc(station.vertices[column]));
      const target = arc(posterior.vertices[column]) + extents[at];
      let continuation: IAutoMovieHumanFaceAttachmentContinuation | undefined;
      if (extents[at] > 0 && Math.max(...stationArcs) < target) {
        continuation = traceHumanSourceOcularContinuation(column, outer.vertices[column], target, host.indices, reference, excluded, exterior);
        continuations[lid].push(continuation);
        for (const point of continuation.points) {
          const corners = host.indices.slice(3 * point.triangle, 3 * point.triangle + 3);
          const resident = corners.filter((_, corner) => point.weights[corner] > 0);
          const incident = resident.length === 1 ? topology.vertexFaces[resident[0]] : new Set(topology.edges.get(resident[0] < resident[1] ? `${resident[0]}:${resident[1]}` : `${resident[1]}:${resident[0]}`));
          for (const triangle of incident) if (depths.has(triangle)) requiredDepth = Math.max(requiredDepth, depths.get(triangle)!);
        }
      }
      coverage.push({ lid, column, stationArcsMetres: stationArcs, extentMetres: extents[at], targetMetres: target, continuationArcsMetres: continuation?.referenceArcsMetres ?? [] });
    }
  }
  let charts = initial;
  if (requiredDepth >= 0) {
    const widened = new Set([...annulus, ...[...depths].filter(([, depth]) => depth <= requiredDepth).map(([triangle]) => triangle)]);
    const completed = closeHumanSourceAttachmentAnnulus(topology, widened, new Set(depths.keys()));
    charts = expandHumanSourceAttachmentAnnulus(cage, host.indices, samples, topology, initial, completed);
  }
  for (const lid of ["upper", "lower"] as const) {
    charts[lid].continuations = continuations[lid];
    const triangles = new Set(charts[lid].sourceTriangles);
    if (continuations[lid].some((path) => path.points.some((point) => !triangles.has(point.triangle))))
      throw new Error("Expanded lid disk does not contain every actual meridian continuation attachment.");
  }
  return { charts, coverage, outerDualDepth: requiredDepth + 1 };
}
