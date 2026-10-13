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
 *
 * @evidence contracts/common.md#principled-implementation `resolveWorldDrivers` applies the driver with `Matrix4.decompose` on both world matrices and `Matrix4.compose` of the selected components, then recomposes the owner's descendants from their local transforms; the premise is a TRS-representable world frame, and the shear and sign loss of decomposition are stated as limits.
 * @evidence contracts/common.md#clear-and-simple-design Three independent booleans select the copied components, so following only a hand's position or only its rotation needs no second driver type, and the offset and blend that other rigs carry are left out because no caller needs them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A flag that is not a boolean throws rather than being coerced, and a missing owner or parent throws through `readWorld` instead of leaving the owner where it was.
 * @evidence contracts/common.md#meaningful-documentation States when the driver runs, the snap semantics with no influence or offset, that limits do not apply, the subtree recomposition, the decomposition limits, and each failure that throws.
 * @author Samchon
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
