/**
 * The topology of one piece of a mesh, as `measureAutoMovieMeshPieces` reports
 * it.
 *
 * A piece is a set of non-degenerate triangles connected through shared edges
 * after the mesh's corners are welded the way `inspectAutoMovieMeshTopology`
 * welds them, so face-local corners at one point join and a seam split for UVs
 * counts once. Two pieces that touch only at a corner stay two pieces. The
 * counts are of welded vertices, undirected edges and triangles, and the genus
 * counts handles: a cube has none, a torus or a mug's handle one.
 */
export interface IAutoMovieMeshPiece {
  /** The lowest triangle ordinal in the piece, which orders the pieces. */
  firstTriangle: number;

  /** Welded vertices the piece's triangles use. */
  vertices: number;

  /** Undirected welded edges the piece's triangles use. */
  edges: number;

  /** Non-degenerate triangles in the piece. */
  faces: number;

  /**
   * Closed loops of edges used by one triangle, counted as connected components
   * of those edges; 0 for a closed piece.
   */
  boundaryLoops: number;

  /** The Euler characteristic, `vertices - edges + faces`. */
  euler: number;

  /**
   * Whether every edge has one or two triangles and every vertex's triangles
   * form one fan, so the piece is a surface with or without boundary.
   */
  manifold: boolean;

  /**
   * Whether the piece's triangles admit one consistent orientation, whatever
   * their stored winding; null when the piece is not manifold.
   */
  orientable: boolean | null;

  /**
   * Whether the stored windings already agree: every edge shared by several
   * triangles is traversed as often in one direction as in the other, which for
   * two triangles means oppositely.
   */
  consistentlyWound: boolean;

  /**
   * Handles, `(2 - euler - boundaryLoops) / 2`, when the piece is manifold and
   * orientable; otherwise null, because the formula holds only there.
   */
  genus: number | null;
}
