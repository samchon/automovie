import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One transformable member of the visible building hierarchy.
 *
 * Lowering composes the transforms parent to child and stages every element
 * that has a model as one world-TRS set piece; an element without a model is a
 * grouping node and is not staged.
 *
 * @evidence contracts/common.md#principled-implementation A parent-local TRS node; `validateBuiltEnvironment` checks a resolving parent with no cycle, finite components, a unit rotation within `1e-6`, strictly positive scale, a resolving model and space, and refuses any composed shear that world TRS staging cannot express.
 * @evidence contracts/common.md#clear-and-simple-design Identity, kind, parent, transform, model and space only; geometry stays in models and grouping is a null model, so one node type serves both drawn members and pure frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shear is refused rather than approximated by a decomposition, including shear that only an operating state would compose, and no engine rule branches on a particular element kind; drawings, quantity take-off and semantic masks use it only as a view-chosen filter or a label.
 * @evidence contracts/common.md#meaningful-documentation States how lowering stages elements, what a null model means, the root and cycle rules, the transform constraints and the shear rule, and where a model id may resolve.
 * @author Samchon
 */
export interface IAutoMovieBuiltElement {
  /** Stable element identity. */
  id: string;

  /**
   * Non-blank open semantic label such as `building`, `storey`, `wall`,
   * `coffer`, `roof`, or a production-specific term.
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
