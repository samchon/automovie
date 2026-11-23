import type { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * A separation that encloses one logical space or divides two.
 *
 * A boundary citing one space is that space's envelope toward the outside; one
 * citing two separates them.
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
