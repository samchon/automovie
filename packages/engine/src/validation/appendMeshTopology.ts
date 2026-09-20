import { IAutoMovieMesh } from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { ViolationCollector } from "./ViolationCollector";

/** Weld tolerance: ring seams recompute cos/sin with ~1e-16 float error. */
const WELD_GRID = 1e9;

/**
 * Append mesh-topology violations to a collector, the shared body behind the
 * standalone {@link validateMeshTopology} and `validateModel`'s mesh check.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `appendMeshTopology` appends welded-edge topology faults at the caller's exact mesh-part path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `appendMeshTopology` shares one incidence-and-winding calculation between model validation and the public standalone result.
 */
export const appendMeshTopology = (
  mesh: IAutoMovieMesh,
  path: string,
  collector: ViolationCollector,
  expectClosed: boolean,
): void => {
  const vertexCount = mesh.positions.length / 3;
  if (vertexCount === 0 || !Number.isInteger(vertexCount)) return;
  const indices =
    mesh.indices ?? Array.from({ length: vertexCount }, (_, i) => i);
  if (indices.length % 3 !== 0) return;
  if (
    indices.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= vertexCount,
    )
  )
    return;

  // A pair of welded ids packs into one safe integer while the id count stays
  // below 2^26; a mesh beyond that has more distinct vertices than this
  // welded map can address, so the check refuses rather than aliasing edges.
  // Ids are dense and assigned before any pair is formed, so `vertexCount`
  // bounds them.
  if (vertexCount >= 2 ** 26)
    throw new Error(
      `mesh topology check supports fewer than ${2 ** 26} vertices, got ${vertexCount}`,
    );
  const pair = (from: number, to: number): number => from * 2 ** 26 + to;

  // A welded key is a pure function of one vertex's position, and a vertex
  // sits on every triangle that uses it. Compute it once per vertex index and
  // give each distinct welded position a dense integer id: the incidence
  // counts below are then keyed by integer pairs instead of by concatenated
  // key strings, which were the remaining allocation in this loop after the
  // per-corner key computation went. The key strings survive in `weldKeys`
  // so a violation still names the edge by its welded coordinates.
  const weldKeys: string[] = [];
  const weldIds = new Map<string, number>();
  const idCache = new Int32Array(vertexCount).fill(-1);
  const weldOf = (vertex: number): number => {
    const cached = idCache[vertex]!;
    if (cached >= 0) return cached;
    const key = [0, 1, 2]
      .map(
        (axis) =>
          Math.round(mesh.positions[vertex * 3 + axis]! * WELD_GRID) || 0,
      )
      .join(",");
    let id = weldIds.get(key);
    if (id === undefined) {
      id = weldKeys.length;
      weldKeys.push(key);
      weldIds.set(key, id);
    }
    idCache[vertex] = id;
    return id;
  };

  // Undirected edge → incident-triangle count (manifoldness); directed edge →
  // count in that traversal direction (winding consistency). Every edge code
  // is appended in traversal order and the copies are sorted numerically, so
  // a count is the length of a run; a hash map keyed by these codes spent
  // most of the check hashing them. The unsorted copy keeps traversal order,
  // which is how a violation is later placed where the map order had it.
  const undirected = new Float64Array(indices.length);
  const directed = new Float64Array(indices.length);
  let edgeCount = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const a = weldOf(indices[i]!);
    const b = weldOf(indices[i + 1]!);
    const c = weldOf(indices[i + 2]!);
    // A triangle with a repeated welded vertex (a pole ring, a collapsed cap)
    // carries no surface: skip it, exactly as the watertightness oracle does.
    if (a === b || b === c || c === a) continue;
    const corners = [a, b, c];
    for (let e = 0; e < 3; ++e) {
      const from = corners[e]!;
      const to = corners[(e + 1) % 3]!;
      directed[edgeCount] = pair(from, to);
      undirected[edgeCount] = from < to ? pair(from, to) : pair(to, from);
      edgeCount += 1;
    }
  }

  // The codes whose incidence count fails `offends`, each with its count, in
  // the order their edges were first traversed: the sorted copy yields the
  // counts, the traversal copy places the few offenders where the incidence
  // map used to list them.
  const sortedUndirected = undirected.slice(0, edgeCount).sort();
  const sortedDirected = directed.slice(0, edgeCount).sort();
  const offenders = (
    codes: Float64Array,
    sorted: Float64Array,
    offends: (count: number) => boolean,
  ): [number, number][] => {
    const found = new Map<number, number>();
    for (let i = 0; i < sorted.length; ) {
      let j = i + 1;
      while (j < sorted.length && sorted[j] === sorted[i]) j += 1;
      if (offends(j - i)) found.set(sorted[i]!, j - i);
      i = j;
    }
    const ordered: [number, number][] = [];
    if (found.size !== 0)
      for (let i = 0; i < edgeCount && found.size !== 0; i += 1) {
        const count = found.get(codes[i]!);
        if (count !== undefined) {
          ordered.push([codes[i]!, count]);
          found.delete(codes[i]!);
        }
      }
    return ordered;
  };

  // A violation names the edge by its two welded keys in the same canonical
  // order the string form had: the lexically smaller key first for an
  // undirected edge, traversal order for a directed one.
  const named = (edge: number, canonical: boolean): string => {
    const from = weldKeys[Math.floor(edge / 2 ** 26)]!;
    const to = weldKeys[edge % 2 ** 26]!;
    return canonical && compareCodeUnits(from, to) > 0
      ? `${to}|${from}`
      : `${from}|${to}`;
  };

  for (const [edge, count] of offenders(
    undirected,
    sortedUndirected,
    (count) => count > 2,
  ))
    collector.push(
      "topology",
      `${path}.indices`,
      `a 2-manifold mesh edge is shared by at most 2 triangles, but the edge (${named(edge, true)}) is shared by ${count}`,
      count,
    );

  for (const [edge, count] of offenders(
    directed,
    sortedDirected,
    (count) => count > 1,
  ))
    collector.push(
      "topology",
      `${path}.indices`,
      `triangles adjacent on an edge must wind in opposite directions, but the directed edge (${named(edge, false)}) appears ${count} times (a flipped triangle)`,
      count,
    );

  if (expectClosed)
    for (const [edge] of offenders(
      undirected,
      sortedUndirected,
      (count) => count === 1,
    ))
      collector.push(
        "topology",
        `${path}.indices`,
        `a closed mesh has every edge shared by 2 triangles, but the edge (${named(edge, true)}) is a boundary (open) edge`,
        named(edge, true),
      );
};
