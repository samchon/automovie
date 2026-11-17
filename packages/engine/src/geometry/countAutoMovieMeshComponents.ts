import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Count components of used triangle vertices under their exact index identity.
 * Coincident positions with different indices stay separate. Unused vertices
 * contribute no component, and an empty triangle population returns zero.
 * Coordinates, winding, area and physical-source aliases do not change this
 * index graph. The result certifies no surface manifoldness or anatomy.
 *
 * @param mesh Borrowed indexed or consecutive-triangle mesh; positions supply only the vertex count.
 * @returns Components containing at least one triangle, including degenerate triangles.
 * @throws The canonical triangleIndicesOf refusal for malformed xyz/index cardinality or out-of-range indices; coordinate finiteness is not needed for this graph.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Mechanically extracts test_human_f1_body's disjoint sets, full path compression, three unions per triangle and used-triangle root census. Sharing an exact index connects triangles; coordinate coincidence is never a union rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Canonical triangleIndicesOf owns index admission; one parent array, one local find and one root set own the existing component census shared by Human's body test and capture observation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No position welding, physical alias reinterpretation, unused-vertex component, expected-count special case or connected-skin acceptance is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation States used-index identity, empty and degenerate behavior, coincident and unused vertices, borrowed buffers, canonical refusals and the limits of a component count.
 * @evidence contracts/development/implementation.md#efficient-algorithms Retains the existing union order and path compression: O(V) initialization and three union operations per triangle, each following a parent path of at most V links before compression. This gives the conservative O(V+TV) worst-case bound and O(V) temporary storage; non-indexed admission also allocates V consecutive indices.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure census of the current buffers has no cross-request effect; indexed admission borrows the original index run, and callers retain the scalar when reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The parent array, used-root set and any non-indexed run have call lifetime. Only the scalar count survives; no mesh, process or cache is retained.
 */
export function countAutoMovieMeshComponents(mesh: IAutoMovieMesh): number {
  const indices: number[] = triangleIndicesOf(mesh, "mesh components");
  const count: number = mesh.positions.length / 3;
  const parent: number[] = Array.from(
    { length: count },
    (_: unknown, i: number): number => i,
  );

  /** Compress the same exact-index parent paths as the original Human test. */
  function find(i: number): number {
    let root: number = i;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[i] !== root) {
      const next: number = parent[i]!;
      parent[i] = root;
      i = next;
    }
    return root;
  }

  // Preserve the original three-edge union order for every used triangle.
  for (let t: number = 0; t + 2 < indices.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = indices[t + e]!;
      const b: number = indices[t + ((e + 1) % 3)]!;
      parent[find(a)] = find(b);
    }
  const components: Set<number> = new Set();
  for (let t: number = 0; t < indices.length; t += 3)
    components.add(find(indices[t]!));
  return components.size;
}
