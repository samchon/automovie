/**
 * Measure triangle topology and signed volume from actual mesh buffers.
 * Asset authors and diagnostics call this through proceduralMesh; validation
 * verdicts remain in validateMeshTopology. Index admission precedes traversal,
 * positions weld on the declared nanometre grid, and input arrays are never
 * mutated. Coordinates are metres and volume is cubic metres. Colour, normal
 * and UV finiteness is counted without allocating concatenated attribute copies.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshTopology } from "./IAutoMovieMeshTopology";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Measure a mesh's triangle topology instead of assuming it.
 *
 * Vertices weld by position, because a builder that gives each face its own
 * corners is still one closed shell. A closed solid must report `watertight`;
 * an assembly of members that share faces, or a surface meant to stay open,
 * reports its boundary and non-manifold edge counts rather than pretending.
 *
 * This measures; it does not judge. `validateMeshTopology` is the engine's
 * verdict on the same surface, adding winding consistency and an `expectClosed`
 * declaration, and it is what `validateModel` runs over every mesh a model
 * carries. A builder that wants a pass or a fail asks that one.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures face, edge, manifold, and volume facts of a mesh.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the topology produced by geometry operations without assuming validity.
 */
export const inspectAutoMovieMeshTopology = (
  mesh: IAutoMovieMesh,
): IAutoMovieMeshTopology => {
  const vertexCount = mesh.positions.length / 3;
  // A pair of welded ids packs into one safe integer while the id count stays
  // below 2^26; a mesh beyond that has more distinct vertices than the packed
  // pair can address, so the measurement refuses rather than aliasing edges.
  // Ids are dense and assigned before any pair is formed, so `vertexCount`
  // bounds them.
  if (vertexCount >= 2 ** 26)
    throw new Error(
      `mesh topology supports fewer than ${2 ** 26} vertices, got ${vertexCount}`,
    );
  const nonFinite =
    countNonFinite(mesh.positions) +
    countNonFinite(mesh.normals) +
    countNonFinite(mesh.uvs) +
    countNonFinite(mesh.colors ?? null);
  const indices = triangleIndicesOf(mesh, "mesh topology");
  // A welded key is a pure function of one vertex's position, and a vertex
  // sits on every triangle that uses it. Compute it once per vertex index and
  // give each distinct welded position a dense integer id, so an edge below
  // is a packed pair of ids rather than a concatenated key string: the same
  // repair `appendMeshTopology` received for the validation verdict.
  const weldIds = new Map<string, number>();
  const idCache = new Int32Array(vertexCount).fill(-1);
  const weldOf = (at: number): number => {
    const cached = idCache[at]!;
    if (cached >= 0) return cached;
    const welded = [0, 1, 2]
      .map((axis) => Math.round(mesh.positions[at * 3 + axis]! * WELD_SCALE))
      .join(",");
    let id = weldIds.get(welded);
    if (id === undefined) {
      id = weldIds.size;
      weldIds.set(welded, id);
    }
    idCache[at] = id;
    return id;
  };
  // Every undirected edge code in traversal order; sorted, a run's length is
  // the edge's incidence count. A hash map keyed by these codes spent most of
  // the measurement hashing them.
  const codes = new Float64Array(indices.length);
  let edgeCount = 0;
  const degenerateTriangles: number[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = weldOf(indices[index]!);
    const b = weldOf(indices[index + 1]!);
    const c = weldOf(indices[index + 2]!);
    if (a === b || b === c || c === a) {
      degenerateTriangles.push(index / 3);
      continue;
    }
    // The degenerate skip above leaves three distinct corner ids, so the two
    // ends of an edge can never compare equal here.
    const corners = [a, b, c];
    for (let edge = 0; edge < 3; ++edge) {
      const from = corners[edge]!;
      const to = corners[(edge + 1) % 3]!;
      codes[edgeCount] = from < to ? from * 2 ** 26 + to : to * 2 ** 26 + from;
      edgeCount += 1;
    }
  }
  const sorted = codes.slice(0, edgeCount).sort();
  let distinctEdges = 0;
  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1;
    while (j < sorted.length && sorted[j] === sorted[i]) j += 1;
    distinctEdges += 1;
    if (j - i === 1) boundaryEdges += 1;
    else if (j - i > 2) nonManifoldEdges += 1;
    i = j;
  }
  let sixVolume = 0;
  const p = mesh.positions;
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]! * 3;
    const b = indices[index + 1]! * 3;
    const c = indices[index + 2]! * 3;
    sixVolume +=
      p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) +
      p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!) +
      p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
  }
  return {
    triangles: indices.length / 3,
    degenerate: degenerateTriangles.length,
    degenerateTriangles,
    nonFinite,
    boundaryEdges,
    nonManifoldEdges,
    watertight:
      distinctEdges > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
    volume: sixVolume / 6,
  };
};

/** Welding grid for topology queries: 1 nm, far below any building tolerance. */
const WELD_SCALE = 1e9;

/**
 * How many components of one optional attribute buffer are not finite numbers.
 *
 * Counted in place rather than over a concatenation, so measuring a merged
 * building does not first allocate a second copy of all of it.
 */
const countNonFinite = (values: readonly number[] | null): number => {
  if (values === null) return 0;
  let count = 0;
  for (const value of values) if (Number.isFinite(value) === false) ++count;
  return count;
};
