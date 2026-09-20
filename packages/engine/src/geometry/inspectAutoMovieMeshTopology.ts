/**
 * Measure triangle topology and signed volume from actual mesh buffers.
 * Asset authors and diagnostics call this through proceduralMesh; validation
 * verdicts remain in validateMeshTopology. Index admission precedes traversal,
 * positions weld on the declared nanometre grid, and input arrays are never
 * mutated. Coordinates are metres and volume is cubic metres. Colour, normal
 * and UV finiteness is counted without allocating concatenated attribute copies.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
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
  const nonFinite =
    countNonFinite(mesh.positions) +
    countNonFinite(mesh.normals) +
    countNonFinite(mesh.uvs) +
    countNonFinite(mesh.colors ?? null);
  const indices = triangleIndicesOf(mesh, "mesh topology");
  // A welded key is a pure function of one vertex's position, and a vertex
  // sits on every triangle that uses it. Compute it once per vertex index;
  // per triangle corner it was three array allocations and a join, the same
  // cost `appendMeshTopology` removed from the validation verdict.
  const keyCache = new Array<string | undefined>(mesh.positions.length / 3);
  const key = (at: number): string => {
    const cached = keyCache[at];
    if (cached !== undefined) return cached;
    const welded = [0, 1, 2]
      .map((axis) => Math.round(mesh.positions[at * 3 + axis]! * WELD_SCALE))
      .join(",");
    keyCache[at] = welded;
    return welded;
  };
  const edges = new Map<string, number>();
  const degenerateTriangles: number[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const corners = [0, 1, 2].map((corner) => key(indices[index + corner]!));
    if (new Set(corners).size < 3) {
      degenerateTriangles.push(index / 3);
      continue;
    }
    for (let edge = 0; edge < 3; ++edge) {
      // The degenerate skip above leaves three distinct corner keys, so the
      // two ends of an edge can never compare equal here.
      const from = corners[edge]!;
      const to = corners[(edge + 1) % 3]!;
      // Same canonical string as sorting the pair, without the array.
      const name =
        compareCodeUnits(from, to) < 0 ? `${from}|${to}` : `${to}|${from}`;
      edges.set(name, (edges.get(name) ?? 0) + 1);
    }
  }
  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (const count of edges.values())
    if (count === 1) boundaryEdges += 1;
    else if (count > 2) nonManifoldEdges += 1;
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
    watertight: edges.size > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
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
