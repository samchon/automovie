import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Count components of used triangle vertices under their exact index identity.
 * Coincident positions with different indices stay separate. Unused vertices
 * contribute no component, and an empty triangle population returns zero.
 * Coordinates, winding, area and physical-source aliases do not change this
 * index graph. The result certifies no surface manifoldness or anatomy.
 * Parameter mesh: Borrowed indexed or consecutive-triangle mesh; positions supply
 * only the vertex count.
 * Returns: Components containing at least one triangle, including degenerate
 * triangles.
 * The canonical triangleIndicesOf refusal for malformed xyz/index
 * cardinality or out-of-range indices; coordinate finiteness is not needed
 * for this graph.
 */
export function countMeshComponents(mesh: IAutoMovieMesh): number {
  const indices: number[] = triangleIndicesOf(mesh, "mesh components");
  const count: number = mesh.positions.length / 3;
  const parent: number[] = Array.from(
    { length: count },
    (_: unknown, i: number): number => i,
  );

  /*
   * Compress the same exact-index parent paths as the original Human test.
   */
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
