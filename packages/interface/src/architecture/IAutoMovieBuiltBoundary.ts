import { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * A separation shared by one interior/exterior region or a pair of regions.
 *
 * A boundary citing one space is that space's envelope toward the outside; one
 * citing two separates them.
 *
 * @evidence contracts/common.md#principled-implementation A boundary is a relation between one or two logical spaces plus optional realizing elements; validation enforces the one-or-two count, unique resolving references, and a usable face when one is stated.
 * @evidence contracts/common.md#clear-and-simple-design The face is optional so a relational boundary needs no geometry, and openings reference the boundary by id instead of nesting inside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A faceless boundary is accepted as relational, but any opening that states a void on it is refused instead of being placed against an assumed plane.
 * @evidence contracts/common.md#meaningful-documentation States what one and two cited spaces mean, the logical boundary with no elements, reference uniqueness, and what stating a face enables.
 */
export interface IAutoMovieBuiltBoundary {
  /** Stable boundary identity. */
  id: string;

  /** Open semantic label such as `wall`, `floor`, `ceiling`, or `threshold`. */
  kind: string;

  /**
   * One enclosing space, or the two spaces this boundary separates; each id
   * resolves and appears once.
   */
  spaces: string[];

  /**
   * Visible elements realizing the boundary, each resolving and listed once;
   * empty for a logical boundary.
   */
  elements: string[];

  /**
   * Where the separation actually is, when it is somewhere at all.
   *
   * A boundary without a face stays the purely relational record it has always
   * been, so an environment written before this field keeps validating
   * unchanged. Stating a face is what lets an opening be placed on the
   * separation and checked against it, because there is finally a surface for
   * "on the wall" and "off the wall" to mean something.
   */
  face?: IAutoMovieBoundaryFace;
}
