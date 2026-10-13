import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A closed triangulated boundary standing for one logical volume.
 *
 * The shell is a single triangle soup rather than a list of shells, because
 * "outer boundary plus voids" is a reading of one closed surface and not a
 * second kind of record: an atrium void is inner facets wound the other way in
 * the same list, so a point in the void is outside the volume by the same
 * arithmetic that puts a point in the room inside it. That is exactly how
 * `IfcFacetedBrepWithVoids` reads, and it is why the containment query needs no
 * case for holes.
 *
 * Nothing is inferred from the mesh. It must already be closed, with every
 * directed edge appearing once and its reverse once, and wound
 * counter-clockwise seen from outside the solid. `validateBuiltEnvironment`
 * checks closure edge by edge, but checks winding only through the sign of the
 * total enclosed volume, so a void wound the same way as the outer boundary
 * passes and is then read as solid. Self-intersection is not checked. A space
 * states its volume either with a shell or with convex cells, never both.
 *
 * @evidence contracts/common.md#principled-implementation Validation checks finite vertices, safe-integer in-range indices, faces with area above `1e-12`, directed-edge closure, and a positive divergence-theorem volume; `builtSpaceContainsPoint` sums Van Oosterom and Strackee signed solid angles and counts points on the surface as inside.
 * @evidence contracts/common.md#clear-and-simple-design One vertex list and one flat index list hold the outer boundary and every void, so containment and volume are each one loop over faces with no case for holes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is repaired: an open, degenerate, or inside-out mesh is refused rather than closed or flipped; the remaining gaps are an unchecked void winding and unchecked self-intersection, both stated in the documentation.
 * @evidence contracts/common.md#meaningful-documentation States why voids share the list, the closure and winding the mesh must already have, what validation does and does not check, the minimum counts, the index layout, and the cells-or-shell exclusivity.
 * @author Samchon
 */
export interface IAutoMovieSpaceShell {
  /** Finite world-space vertices, in metres, the triangles index; at least four. */
  vertices: IAutoMovieVector3[];

  /**
   * Triangles as flat vertex-index triples, so `triangles[3i]`,
   * `triangles[3i+1]` and `triangles[3i+2]` are one face. Each index is a whole
   * number naming a vertex, and the length is a multiple of three with at least
   * four faces, because nothing fewer closes a solid.
   */
  triangles: number[];
}
