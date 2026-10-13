import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One transformable member of the visible building hierarchy.
 *
 * Lowering composes the transforms parent to child and stages every element
 * that has a model as one world-TRS set piece; an element without a model is a
 * grouping node and is not staged.
 */
export interface IAutoMovieBuiltElement {
  /** Stable element identity. */
  id: string;

  /**
   * Open semantic label such as `building`, `storey`, `wall`, `coffer`, `roof`,
   * or a production-specific term.
   */
  kind: string;

  /**
   * Parent element id, or null for a root; every root must be some building
   * unit's root element, and the parent chain may not cycle.
   */
  parent: string | null;

  /**
   * Local transform in the parent element's frame: finite, unit-quaternion
   * rotation and strictly positive scale. Rotated children belong under
   * uniformly scaled parents, since a composed shear is refused.
   */
  transform: IAutoMovieTransform;

  /**
   * Visible model id, naming an environment-owned model or a
   * `modelReferences` entry, or null for a transform-only group.
   */
  model: string | null;

  /** Primary logical space occupied by this element, or null. */
  space: string | null;
}
