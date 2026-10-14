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
 * @evidence contracts/common.md#principled-implementation Validation checks finite vertices, safe in-range indices, finite cross-product length above 1e-12 (twice facet area), opposite directed-edge pairing exactly once and finite positive aggregate signed volume. Containment first tests triangle boundaries, then sums signed solid angles and accepts absolute winding at least 2*pi; closed consistently oriented components and usable finite intermediates remain premises beyond those validation checks.
 * @evidence contracts/common.md#clear-and-simple-design One vertex list and one flat index list hold the outer boundary and every void, so containment and volume are each one loop over faces with no case for holes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is repaired. Missing/duplicated edge pairings, unusable facets and nonpositive aggregate volume are refused; positive aggregate volume does not prove every disconnected component's orientation, manifold vertex topology or absence of self-intersection. Solid-angle and volume arithmetic can round, cancel or overflow, and surface tests reuse one slack at different geometric scales rather than certifying exact contact.
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
