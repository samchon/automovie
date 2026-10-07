import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularCage } from "../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFaceOcularSurfaceShape } from "../../structures/IAutoMovieHumanFaceOcularSurfaceShape";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import { evaluateHumanFaceMaterialPatch } from "./evaluateHumanFaceMaterialPatch";

/**
 * Raise medial relief on the source-registered pocket and plica edge path.
 *
 * The pocket contributes its actual resident skin triangles. Relief vanishes
 * on their boundary, preserving the native join. Caruncle relief follows the
 * normalized distance to that boundary; plica relief follows distance to the
 * registered path, with width cornerLength/12. Both envelopes are authored
 * coarse conventions, not measured tissue anatomy. Source skin and its normals
 * transport the patch under shape and pose; no ocular or head-axis sheet
 * replaces the pocket. Absence is handled by the caller's legacy convention.
 *
 * @evidence contracts/common.md#principled-implementation Resident skin incidence carries one registered patch; boundary-zero normal relief preserves its join, and distances are measured against its actual edges.
 * @evidence contracts/common.md#clear-and-simple-design One patch generator consumes the source registration and the existing two projections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty or nonresident registrations refuse instead of substituting a different pocket or hiding a part.
 * @evidence contracts/common.md#meaningful-documentation States transport, boundaries, envelope width and the authored anatomical limitation.
 * @evidence contracts/modeling.md#part-identity-and-grouping Supplies the registered medial caruncle-plica surface to its existing part owner.
 * @evidence contracts/modeling.md#shared-boundaries Native patch boundary vertices remain unchanged; inside vertices use the same skin normal owner.
 * @evidence contracts/modeling.md#spatial-conventions Source head-frame metres; projection millimetres convert once.
 * @evidence contracts/modeling.md#emitted-geometry Two shared-edge midpoint subdivisions of resident pocket triangles provide interior relief samples even when the coarse source's vertices all lie on its boundary; no triangles extend beyond that patch.
 * @evidence contracts/modeling.md#parameter-channels Existing caruncle and plica projections stay independent; corner length supplies the authored plica envelope width.
 * @evidence contracts/anatomy.md#anatomical-source Pocket and plica are offline source conventions qualified by their registration; envelopes and width lack a read population measurement.
 * @evidence contracts/anatomy.md#permitted-range Registration must contain resident triangles, a boundary and at least one finite nonzero plica edge; ordinary ocular admission judges its emitted geometry.
 * @evidence contracts/anatomy.md#parametric-authority Consumes named projection dimensions and shared-source registration, with no personal vertex authoring.
 */
export function buildHumanFaceMedialBedSurface(
  basis: IAutoMovieHumanFaceBasis,
  cage: IAutoMovieHumanFacePeriocularCage,
  positions: readonly number[],
  profile: IAutoMovieHumanFaceOcularSurfaceShape,
): IAutoMovieMesh {
  const bed = cage.medialBed;
  const source = basis.surfaces.find((surface) => surface.id === cage.surface);
  if (bed === undefined || source === undefined)
    throw new Error("Medial relief needs its registered skin pocket and plica path.");
  const material = bed.materialPatch === undefined ? undefined : evaluateHumanFaceMaterialPatch(bed.materialPatch, source, positions);
  const plicaVertices = bed.materialPatch?.plica ?? bed.plicaVertices;
  const initialPositions = material?.positions ?? [...positions];
  const vertices = new Set(material === undefined ? bed.pocketVertices : Array.from({ length: material.positions.length / 3 }, (_value, at) => at));
  if (plicaVertices.length < 2 || [...vertices, ...plicaVertices].some((vertex) =>
    !Number.isSafeInteger(vertex) || vertex < 0 || 3 * vertex + 2 >= initialPositions.length))
    throw new Error("Medial relief registration has a nonresident skin vertex.");
  const triangles: number[] = [];
  const edges = new Map<string, number[]>();
  const hostIndices = material?.indices ?? source.indices;
  for (let at = 0; at < hostIndices.length; at += 3) {
    const face = hostIndices.slice(at, at + 3);
    if (!face.every((vertex) => vertices.has(vertex))) continue;
    triangles.push(...face);
    for (let corner = 0; corner < 3; corner++) {
      const a = face[corner], b = face[(corner + 1) % 3];
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      const entry = edges.get(key);
      if (entry === undefined) edges.set(key, [a, b, 1]);
      else entry[2]++;
    }
  }
  let boundary = [...edges.values()].filter((edge) => edge[2] === 1);
  if (triangles.length === 0 || boundary.length === 0)
    throw new Error("Medial relief needs a resident skin patch with a boundary.");
  if (plicaVertices.some((vertex) => !vertices.has(vertex)) ||
      plicaVertices.slice(1).some((vertex, at) => !edges.has(
        Math.min(vertex, plicaVertices[at]) + ":" + Math.max(vertex, plicaVertices[at]))))
    throw new Error("Medial relief plica path must follow the registered pocket's resident edges.");
  const samples = [...initialPositions];
  const directions = material?.normals ?? [...createHumanFaceSkinHost(source.indices, positions).normals];
  const point = (vertex: number): number[] => samples.slice(3 * vertex, 3 * vertex + 3);
  const margin = cage.stations.find((station) => station.role === "posteriorMargin");
  if (margin === undefined) throw new Error("Medial relief needs its actual posterior margin.");
  const origin = positions[3 * margin.vertices[cage.medialColumn]];
  const towards = Math.sign(positions[3 * margin.vertices[cage.upperColumns[1]]] - origin);
  const extent = profile.cornerLength / 1000;
  const span = Math.max(...[...vertices].map((vertex) => towards * (point(vertex)[0] - origin)));
  if (towards === 0 || !(extent > 0) || extent > span)
    throw new Error("Medial relief extent exceeds its registered skin pocket's support: requested " + extent + " m, support " + span + " m.");
  // Midpoints are shared by adjacent source triangles, so subdivision adds
  // interior relief samples while preserving the original patch boundary.
  for (let level = 0; level < 2; level++) {
    const shared = new Map<string, number>();
    const midpoint = (a: number, b: number): number => {
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      const existing = shared.get(key);
      if (existing !== undefined) return existing;
      const vertex = samples.length / 3;
      const normal = [0, 1, 2].map((axis) => directions[3 * a + axis] + directions[3 * b + axis]);
      const length = Math.hypot(...normal);
      if (!(length > 0)) throw new Error("Medial patch subdivision needs compatible skin normals.");
      samples.push(...point(a).map((value, axis) => (value + samples[3 * b + axis]) / 2));
      directions.push(...normal.map((value) => value / length));
      shared.set(key, vertex);
      return vertex;
    };
    const refined: number[] = [];
    for (let at = 0; at < triangles.length; at += 3) {
      const a = triangles[at], b = triangles[at + 1], c = triangles[at + 2];
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      refined.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    triangles.splice(0, triangles.length, ...refined);
  }
  // Clip the actual host to the requested medial-to-iris extent. Crossing
  // edges share their intersection, retaining a continuous resident patch.
  const cuts = new Map<string, number>();
  const depth = (vertex: number): number => towards * (point(vertex)[0] - origin);
  const cut = (a: number, b: number): number => {
    if (depth(a) === extent) return a;
    if (depth(b) === extent) return b;
    const key = Math.min(a, b) + ":" + Math.max(a, b);
    const prior = cuts.get(key);
    if (prior !== undefined) return prior;
    const t = (extent - depth(a)) / (depth(b) - depth(a));
    const vertex = samples.length / 3;
    const normal = [0, 1, 2].map((axis) => directions[3 * a + axis] * (1 - t) + directions[3 * b + axis] * t);
    const length = Math.hypot(...normal);
    if (!(length > 0)) throw new Error("Medial relief cut needs compatible host normals.");
    samples.push(...point(a).map((value, axis) => value * (1 - t) + samples[3 * b + axis] * t));
    directions.push(...normal.map((value) => value / length));
    cuts.set(key, vertex);
    return vertex;
  };
  const clipped: number[] = [];
  for (let at = 0; at < triangles.length; at += 3) {
    const face = triangles.slice(at, at + 3);
    const polygon: number[] = [];
    for (let corner = 0; corner < 3; corner++) {
      const a = face[corner], b = face[(corner + 1) % 3];
      if (depth(a) <= extent) polygon.push(a);
      if ((depth(a) < extent && depth(b) > extent) || (depth(a) > extent && depth(b) < extent))
        polygon.push(cut(a, b));
    }
    for (let corner = 1; corner + 1 < polygon.length; corner++)
      clipped.push(polygon[0], polygon[corner], polygon[corner + 1]);
  }
  triangles.splice(0, triangles.length, ...clipped);
  const clippedEdges = new Map<string, number[]>();
  for (let at = 0; at < triangles.length; at += 3)
    for (let corner = 0; corner < 3; corner++) {
      const a = triangles[at + corner], b = triangles[at + (corner + 1) % 3];
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      const edge = clippedEdges.get(key);
      if (edge === undefined) clippedEdges.set(key, [a, b, 1]);
      else edge[2]++;
    }
  boundary = [...clippedEdges.values()].filter((edge) => edge[2] === 1);
  if (triangles.length === 0 || boundary.length === 0)
    throw new Error("Medial relief extent leaves no supported skin patch.");
  const distance = (p: readonly number[], a: readonly number[], b: readonly number[]): number => {
    const d = b.map((value, axis) => value - a[axis]);
    const squared = d.reduce((sum, value) => sum + value * value, 0);
    const t = squared === 0 ? 0 : Math.min(1, Math.max(0,
      d.reduce((sum, value, axis) => sum + value * (p[axis] - a[axis]), 0) / squared));
    return Math.hypot(...p.map((value, axis) => value - a[axis] - t * d[axis]));
  };
  const path = plicaVertices.slice(1).map((vertex, at) => [point(plicaVertices[at]), point(vertex)]);
  if (!path.some(([a, b]) => Math.hypot(...a.map((value, axis) => value - b[axis])) > 0))
    throw new Error("Medial relief needs a nonzero registered plica path.");
  const resident = [...new Set(triangles)];
  const border = resident.map((vertex) => Math.min(...boundary.map(([a, b]) => distance(point(vertex), point(a), point(b)))));
  const maximum = Math.max(...border);
  const width = profile.cornerLength / 12000;
  const output = resident.flatMap((vertex, at) => {
    const p = point(vertex);
    const weight = maximum === 0 ? 0 : border[at] / maximum;
    const near = Math.min(...path.map(([a, b]) => distance(p, a, b)));
    const fold = width === 0 ? 0 : Math.exp(-((near / width) ** 2));
    const height = weight * (profile.caruncleProjection + profile.plicaProjection * fold) / 1000;
    return p.map((value, axis) => value + directions[3 * vertex + axis] * height);
  });
  const lookup = new Map(resident.map((vertex, at) => [vertex, at]));
  const indices = triangles.map((vertex) => lookup.get(vertex)!);
  return { positions: output, indices, normals: areaWeightedNormals(output, indices), uvs: null, skin: null };
}
