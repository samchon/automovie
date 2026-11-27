/**
 * One topological or shape defect of a triangle mesh, located by the vertices
 * that carry it, as `measureMeshDefects` lists them.
 *
 * A defect is either an edge between two welded corners or one whole triangle,
 * and `kind` says which. Vertex indices address the measured position buffer as
 * the mesh itself names its corners, before welding, so a consumer can read the
 * positions back without repeating the weld.
 */
export interface IAutoMovieMeshDefect {
  /** Which defect this is. */
  kind: IAutoMovieMeshDefect.Kind;

  /**
   * Vertex indices into the measured position buffer: two for an edge kind,
   * three for a triangle kind.
   *
   * An edge's pair is the original, unwelded indices of its two ends in the
   * order its first using triangle traverses them. A triangle's three are its
   * own corners in their stored order.
   */
  vertices: number[];
}

/** Data and callback contracts shared by the MeshDefect operations. */
export namespace IAutoMovieMeshDefect {
  /**
   * The defect classes `measureMeshDefects` tells apart.
   *
   * `open`, `non-manifold` and `inconsistent` are edge kinds: an edge between
   * two welded corners used by exactly one triangle, by more than two, or by
   * exactly two that traverse it in the same direction. `degenerate` and
   * `sliver` are triangle kinds: a triangle whose corners weld onto fewer than
   * three lattice cells, or a triangle on three distinct cells whose aspect
   * exceeds the caller's limit.
   */
  export type Kind =
    | "open"
    | "non-manifold"
    | "inconsistent"
    | "degenerate"
    | "sliver";
}
