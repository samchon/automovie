import { areaWeightedNormals } from "@automovie/human/common/mesh/areaWeightedNormals";
import { readHumanBodyMaterialSurfaceIncidence } from "../human-source/body-anatomy/readHumanBodyMaterialSurfaceIncidence.ts";
import type { IHumanCranialSourceInput } from "./IHumanCranialSourceInput.ts";
import type { IHumanCranialSourceRepair } from "./IHumanCranialSourceRepair.ts";

/** Original source face ordinals survive every declared contraction. @author Samchon */
interface SourceFace { source: number; vertices: number[] }

/** Candidate ordering is geometric length then original vertex ordinals. @author Samchon */
interface SourceEdge { a: number; b: number; length: number }

/** Both incident zero faces and the exact endpoint-link intersection. @author Samchon */
interface SourceContraction extends SourceEdge {
  incident: SourceFace[];
  link: number[];
  opposite: number[];
}

/**
 * Contract only an exact zero-area, two-face source cell satisfying the
 * manifold edge link condition. Coincident shading vertices are aliases;
 * their ordinals remain. The removed endpoint takes an existing acquired
 * coordinate, with no average, tolerance, skin projection or new normal.
 * Retained faces must stay nonzero and retain their original orientation.
 * Complete coordinate/face lineage and Euler preservation are returned.
 * This source operation does not establish global embedding or anatomy.
 */
export function repairHumanCranialSourceZeroCells(
  mesh: IHumanCranialSourceInput["sources"][number]["mesh"],
): IHumanCranialSourceRepair {
  if (mesh.positions.length === 0 || mesh.positions.length % 3 !== 0 || mesh.indices.length === 0 ||
      mesh.indices.length % 3 !== 0 || mesh.normals.length !== mesh.positions.length ||
      !mesh.positions.every(Number.isFinite) || !mesh.normals.every(Number.isFinite) ||
      mesh.indices.some((vertex) => !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= mesh.positions.length / 3))
    throw new Error("Cranial source repair requires finite complete indexed original geometry.");
  const positions = [...mesh.positions];
  let faces: SourceFace[] = Array.from({ length: mesh.indices.length / 3 }, (_, face) => ({
    source: face, vertices: mesh.indices.slice(3 * face, 3 * face + 3),
  }));
  const point = (vertex: number): number[] => positions.slice(3 * vertex, 3 * vertex + 3);
  const cross = (values: number[], vertices: number[]): number[] => {
    const [a, b, c] = vertices.map((vertex) => values.slice(3 * vertex, 3 * vertex + 3));
    const u = b.map((value, axis) => value - a[axis]);
    const v = c.map((value, axis) => value - a[axis]);
    const result = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (!result.every(Number.isFinite)) throw new Error("Cranial source area is unrepresentable.");
    return result;
  };
  const zero = (face: SourceFace): boolean => Math.hypot(...cross(positions, face.vertices)) === 0;
  const originalZeroFaces = faces.filter(zero).map((face) => face.source);
  if (originalZeroFaces.length === 0) {
    const incidence = readHumanBodyMaterialSurfaceIncidence(mesh.positions, mesh.indices);
    if (!incidence.qualified) throw new Error("Unchanged acquired cranial incidence refused: " + JSON.stringify(incidence.failures));
    return { mesh, receipt: null };
  }
  const originalZeroSet = new Set(originalZeroFaces);
  const beforeTopology = topology(mesh.positions, faces);
  const contractions: NonNullable<IHumanCranialSourceRepair["receipt"]>["contractions"] = [];
  const moved: NonNullable<IHumanCranialSourceRepair["receipt"]>["movedVertices"] = [];
  while (faces.some(zero)) {
    const representatives = new Map<string, number>();
    const aliases = Array.from({ length: positions.length / 3 }, (_, vertex) => {
      const key = JSON.stringify(point(vertex));
      let representative = representatives.get(key);
      if (representative === undefined) { representative = vertex; representatives.set(key, vertex); }
      return representative;
    });
    const selected = faces.find(zero);
    if (selected === undefined) throw new Error("Source zero-cell selection lost its original face.");
    const corners = selected.vertices.map((vertex) => aliases[vertex]);
    const candidates: SourceEdge[] = [0, 1, 2].map((at) => {
      const a = corners[at], b = corners[(at + 1) % 3];
      return { a: Math.min(a, b), b: Math.max(a, b),
        length: Math.hypot(...point(a).map((value, axis) => value - point(b)[axis])) };
    }).filter((edge) => edge.a !== edge.b).sort((a, b) => a.length - b.length || a.a - b.a || a.b - b.b);
    let chosen: SourceContraction | undefined;
    for (const edge of candidates) {
      const neighbours = (vertex: number): Set<number> => new Set(faces
        .filter((face) => face.vertices.some((corner) => aliases[corner] === vertex))
        .flatMap((face) => face.vertices.map((corner) => aliases[corner]))
        .filter((corner) => corner !== vertex));
      const incident = faces.filter((face) => {
        const vertices = face.vertices.map((vertex) => aliases[vertex]);
        return vertices.includes(edge.a) && vertices.includes(edge.b);
      });
      const left = neighbours(edge.a), right = neighbours(edge.b);
      const link = [...left].filter((vertex) => right.has(vertex)).sort((a, b) => a - b);
      const opposite = [...new Set(incident.flatMap((face) => face.vertices.map((vertex) => aliases[vertex])))
        .values()].filter((vertex) => vertex !== edge.a && vertex !== edge.b).sort((a, b) => a - b);
      const endpointEdges = (vertex: number): Set<string> => new Set(faces
        .filter((face) => face.vertices.some((corner) => aliases[corner] === vertex))
        .map((face) => face.vertices.map((corner) => aliases[corner]).filter((corner) => corner !== vertex))
        .map(([a, b]) => `${Math.min(a, b)}/${Math.max(a, b)}`));
      const leftEdges = endpointEdges(edge.a), rightEdges = endpointEdges(edge.b);
      const sharedLinkEdge = [...leftEdges].some((key) => rightEdges.has(key));
      if (incident.length === 2 && incident.every((face) => zero(face) && originalZeroSet.has(face.source)) &&
          opposite.length === 2 && link.length === opposite.length &&
          link.every((value, at) => value === opposite[at]) && !sharedLinkEdge) {
        const proposed = [...positions];
        const removedAliases = new Set(aliases.flatMap((alias, vertex) => alias === edge.b ? [vertex] : []));
        const retained = point(edge.a);
        for (const vertex of removedAliases)
          for (let axis = 0; axis < 3; axis++) proposed[3 * vertex + axis] = retained[axis];
        const removedFaces = new Set(incident.map((face) => face.source));
        const preservesOriginalFaces = faces.every((face) => {
          if (removedFaces.has(face.source) || !face.vertices.some((vertex) => removedAliases.has(vertex))) return true;
          const before = cross(mesh.positions, face.vertices), after = cross(proposed, face.vertices);
          const beforeLength = Math.hypot(...before), afterLength = Math.hypot(...after);
          if (originalZeroSet.has(face.source)) return afterLength === 0;
          if (!(beforeLength > 0) || !(afterLength > 0)) return false;
          const agreement = before.reduce((sum, value, axis) => sum + value / beforeLength * after[axis] / afterLength, 0);
          return agreement > 0;
        });
        if (!preservesOriginalFaces) continue;
        chosen = { ...edge, incident, link, opposite };
        break;
      }
    }
    if (chosen === undefined) throw new Error("Source zero cell has no exact two-face manifold contraction: " + selected.source);
    const retained = point(chosen.a), removed = point(chosen.b);
    for (let vertex = 0; vertex < aliases.length; vertex++) {
      if (aliases[vertex] !== chosen.b) continue;
      moved.push({ vertex, before: point(vertex), after: retained, distanceMetres: chosen.length });
      for (let axis = 0; axis < 3; axis++) positions[3 * vertex + axis] = retained[axis];
    }
    const removedFaces = new Set(chosen.incident.map((face) => face.source));
    contractions.push({ retainedVertex: chosen.a, removedVertex: chosen.b,
      retainedCoordinate: retained, removedCoordinate: removed,
      removedSourceFaces: [...removedFaces], link: chosen.link, opposite: chosen.opposite });
    faces = faces.filter((face) => !removedFaces.has(face.source));
  }
  const movedOrdinals = new Set(moved.map((entry) => entry.vertex));
  let changedRetainedFaces = 0;
  for (const face of faces) {
    const before = cross(mesh.positions, face.vertices), after = cross(positions, face.vertices);
    const beforeLength = Math.hypot(...before), afterLength = Math.hypot(...after);
    const agreement = before.reduce((sum, value, axis) => sum + value / beforeLength * after[axis] / afterLength, 0);
    if (!(beforeLength > 0) || !(afterLength > 0) || !(agreement > 0))
      throw new Error("Source contraction reverses a retained face: " + face.source);
    if (face.vertices.some((vertex) => movedOrdinals.has(vertex))) changedRetainedFaces++;
  }
  const indices = faces.flatMap((face) => face.vertices);
  const afterTopology = topology(positions, faces);
  if (afterTopology.eulerCharacteristic !== beforeTopology.eulerCharacteristic)
    throw new Error("Source contraction changed the original Euler characteristic.");
  const incidence = readHumanBodyMaterialSurfaceIncidence(positions, indices);
  if (!incidence.qualified) throw new Error("Repaired source incidence refused: " + JSON.stringify(incidence.failures));
  const normals = areaWeightedNormals(positions, indices);
  const used = new Set(indices);
  for (let vertex = 0; vertex < positions.length / 3; vertex++) {
    if (!used.has(vertex)) {
      for (let axis = 0; axis < 3; axis++) normals[3 * vertex + axis] = mesh.normals[3 * vertex + axis];
    } else if (!(Math.hypot(normals[3 * vertex], normals[3 * vertex + 1], normals[3 * vertex + 2]) > 0))
      throw new Error("Repaired referenced source vertex has no area normal.");
  }
  return { mesh: { ...mesh, positions, indices, normals }, receipt: {
    originalVertices: mesh.positions.length / 3, vertices: positions.length / 3,
    originalTriangles: mesh.indices.length / 3, triangles: indices.length / 3,
    originalZeroFaces, contractions, movedVertices: moved, changedRetainedFaces,
    beforeTopology, afterTopology, retainedSourceFaces: faces.map((face) => face.source),
    maximumCoordinateChangeMetres: moved.reduce((maximum, entry) => Math.max(maximum, entry.distanceMetres), 0),
    normalProtocol: "Shared area-weighted retained faces; original acquired directions on unused ordinals",
  } };
}

/** Incidence owns edge/link qualification; this calculation owns original V-E+F. */
function topology(
  positions: number[], faces: SourceFace[],
): NonNullable<IHumanCranialSourceRepair["receipt"]>["beforeTopology"] {
  const indices = faces.flatMap((face) => face.vertices);
  const reading = readHumanBodyMaterialSurfaceIncidence(positions, indices);
  const failures = reading.failures.filter((failure) => failure.reason !== "collapsed-triangles");
  if (failures.length) throw new Error("Source contraction needs closed oriented exact-seam manifold incidence: " + JSON.stringify(failures));
  const vertices = new Set<number>(), edges = new Set<string>();
  for (const face of faces) {
    const corners = face.vertices.map((vertex) => reading.aliases[vertex]);
    for (let at = 0; at < 3; at++) {
      const a = corners[at], b = corners[(at + 1) % 3];
      vertices.add(a);
      edges.add(`${Math.min(a, b)}/${Math.max(a, b)}`);
    }
  }
  return { vertices: vertices.size, edges: edges.size, faces: faces.length,
    boundaryEdges: 0, nonManifoldEdges: 0, windingEdges: 0,
    eulerCharacteristic: vertices.size - edges.size + faces.length };
}
