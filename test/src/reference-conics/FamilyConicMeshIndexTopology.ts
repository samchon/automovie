import { countAutoMovieMeshComponents } from "@automovie/engine";
import type { IAutoMovieConstructionRealization } from "@automovie/interface";

/**
 * The emitted skin's connected components and edge incidence by exact triangle index.
 * Coincident vertices retain their distinct indices. The emitted index array is required.
 * An empty index array has zero components and edges. Three or more uses are non-manifold.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the canonical index component census, then counts each undirected edge once per actual triangle occurrence. It reads the same exact indices used to draw the skin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing component call and one pass over used edges share a scalar result.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No position welding, index replacement or assumed retained seam can reduce an open edge count.
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact index identity, one-use edges and three-or-more-use edges.
 * @evidence contracts/development/implementation.md#efficient-algorithms One existing component computation and one linear edge traversal keep O(V+E) scratch.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same index observation serves the body test and the ordinary capture's actual mesh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the edge and component counts survive. The emitted buffers stay borrowed.
 */
export function FamilyConicMeshIndexTopology(
  mesh: Pick<IAutoMovieConstructionRealization.IMesh, "positions" | "indices">,
): {
  /** Components containing used triangle indices. */
  usedIndexComponents: number;
  /** Distinct undirected edges used once. */
  boundaryEdges: number;
  /** Distinct undirected edges used three or more times. */
  nonManifoldEdges: number;
  /** Distinct undirected edges visited by emitted triangles. */
  edges: number;
} {
  const usedIndexComponents: number = countAutoMovieMeshComponents({
    positions: mesh.positions,
    indices: mesh.indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const count: number = mesh.positions.length / 3;
  const uses: Map<number, number> = new Map();
  for (let t: number = 0; t + 2 < mesh.indices.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = mesh.indices[t + e]!;
      const b: number = mesh.indices[t + ((e + 1) % 3)]!;
      const key: number = Math.min(a, b) * count + Math.max(a, b);
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  let boundaryEdges: number = 0;
  let nonManifoldEdges: number = 0;
  for (const used of uses.values()) {
    if (used === 1) ++boundaryEdges;
    if (used > 2) ++nonManifoldEdges;
  }
  return { usedIndexComponents, boundaryEdges, nonManifoldEdges, edges: uses.size };
}
