import { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/** A separation shared by one interior/exterior region or a pair of regions. */
export interface IAutoMovieBuiltBoundary {
  /** Stable boundary identity. */
  id: string;

  /** Open semantic label such as `wall`, `floor`, `ceiling`, or `threshold`. */
  kind: string;

  /** One enclosing space, or the two spaces this boundary separates. */
  spaces: string[];

  /** Visible elements realizing the boundary; empty for a logical boundary. */
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
