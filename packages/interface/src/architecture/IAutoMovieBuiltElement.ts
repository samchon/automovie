import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One transformable member of the visible building hierarchy.
 *
 * Lowering composes the transforms parent to child and stages every element
 * that has a model as one world-TRS set piece; an element without a model is a
 * grouping node and is not staged.
 *
 * @evidence contracts/common.md#principled-implementation Elements form a parent-local TRS tree composed root to leaf with 4x4 matrices; validation requires an acyclic tree, finite components, a unit quaternion, positive scale, and a composed world matrix that decomposes back without shear in every named operating state.
 * @evidence contracts/common.md#clear-and-simple-design Visible placement is kept apart from logical membership, with `space` as an optional primary-space id, so a hall's elements need no wall-backed room to exist and a room needs no element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shear is refused instead of being silently dropped when lowering to world TRS, and a model id must resolve to an owned model or a declared runtime reference instead of being created on demand.
 * @evidence contracts/common.md#meaningful-documentation States the transform frame and its constraints, the null meanings of parent, model and space, where a model id may resolve, and which elements become staged set pieces.
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
