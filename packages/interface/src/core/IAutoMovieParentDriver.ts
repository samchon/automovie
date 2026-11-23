/**
 * Parent an owner to another node as a relationship (Child-Of), per component.
 *
 * Resolved in the world-space pass after the hierarchy is composed: both world
 * matrices are decomposed into position, rotation and scale, each enabled
 * component of the owner is replaced by the parent node's, the others keep the
 * owner's composed values, and the owner's subtree recomposes. There is no
 * influence and no kept offset, so an enabled component snaps the owner onto
 * the parent, and channel limits never clamp the result. Decomposition drops
 * any shear from a non-uniformly scaled ancestor and recovers scale as positive
 * axis lengths. A non-boolean flag, or an owner or parent missing from the
 * frame, throws.
 */
export interface IAutoMovieParentDriver {
  /** Selects the Child-Of driver. */
  type: "parent";

  /** Node that follows; its subtree recomposes after it moves. */
  owner: string;

  /** Node followed. */
  parent: string;

  /** Whether the owner takes the parent's world position. */
  translation: boolean;

  /** Whether the owner takes the parent's world rotation. */
  rotation: boolean;

  /** Whether the owner takes the parent's world scale. */
  scale: boolean;
}
