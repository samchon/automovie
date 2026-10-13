import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/** One transformable member of the visible building hierarchy. */
export interface IAutoMovieBuiltElement {
  /** Stable element identity. */
  id: string;

  /**
   * Open semantic label such as `building`, `storey`, `wall`, `coffer`, `roof`,
   * or a production-specific term.
   */
  kind: string;

  /** Parent element id, or null for an environment root. */
  parent: string | null;

  /** Local transform in the parent element's frame. */
  transform: IAutoMovieTransform;

  /** Visible model id, or null for a transform-only group. */
  model: string | null;

  /** Primary logical space occupied by this element, or null. */
  space: string | null;
}
