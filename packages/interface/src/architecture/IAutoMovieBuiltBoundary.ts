import { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * A separation that encloses one logical space or divides two.
 *
 * A boundary citing one space is that space's envelope toward the outside; one
 * citing two separates them.
 *
 * @evidence contracts/common.md#principled-implementation A relation record that `validateBuiltEnvironment` checks for one or two resolving, unduplicated spaces, resolving unduplicated elements, a non-blank kind, and, when present, a usable face; only a boundary with a usable face can host an opening's void.
 * @evidence contracts/common.md#clear-and-simple-design Relation and geometry are separable: the required members state which spaces are separated, and the optional face carries location only when the work needs openings or envelope geometry on it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An opening that states a void on a boundary without a face is refused rather than placed on an assumed plane, and the space count is checked instead of padded with an implicit exterior.
 * @evidence contracts/common.md#meaningful-documentation States what one and two cited spaces mean, the resolution and uniqueness of both lists, the meaning of an empty element list, and what an absent face leaves out.
 * @author Samchon
 */
export interface IAutoMovieBuiltBoundary {
  /** Stable boundary identity. */
  id: string;

  /**
   * Non-blank open semantic label such as `wall`, `floor`, `ceiling`, or
   * `threshold`.
   */
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
   * Where the separation is, when it is located.
   *
   * Absent, the boundary is a purely relational record: it still separates its
   * spaces, but no opening may state a void on it. Stating a face is what lets
   * an opening be placed on the separation and checked against it.
   */
  face?: IAutoMovieBoundaryFace;
}
