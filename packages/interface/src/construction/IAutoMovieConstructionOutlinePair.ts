import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * One view's two edges of a part, as signed chart coordinates of the section's extremes on either side of the axis.
 *
 * `positive` is the coordinate of the extreme on the axis's positive side and must stay above zero, `negative` the coordinate on its negative side and must stay below zero: a box that does not hold its axis strictly inside it cannot be a polar section about that axis, and the engine leaves such a station out with one diagnostic.
 *
 * @evidence contracts/development/design.md#principled-representation A view of a solid shows two silhouette edges; storing each as a signed coordinate keeps an asymmetric part (the deeper front of a trunk, the medial bulge of a calf) without an offset or a symmetry assumption.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One pair type serves the front and the side view alike.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Signs are stated, not inferred: an edge that crosses the axis is reported, never mirrored or clamped.
 * @evidence contracts/development/common.md#meaningful-documentation States what each edge is, the sign each must keep and the effect of a box that does not hold its axis.
 */
export interface IAutoMovieConstructionOutlinePair {
  /** The edge on the positive side of the axis, metres, above zero at every station. */
  positive: IAutoMovieConstructionOutline;

  /** The edge on the negative side of the axis, metres, below zero at every station. */
  negative: IAutoMovieConstructionOutline;
}
