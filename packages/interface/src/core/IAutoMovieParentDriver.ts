/**
 * Parent an owner to another node as a relationship (Child-Of), per-component.
 *
 * Resolved in the world-space pass: each enabled component of the owner's world
 * transform is replaced by the parent node's world component, the others keep
 * the owner's composed values, and the owner's subtree recomposes. There is no
 * influence and no kept offset, so an enabled component snaps the owner onto
 * the parent, and limits never clamp the result. A non-boolean flag throws.
 *
 * @evidence contracts/common.md#principled-implementation Decomposes both world matrices into position, rotation and scale and recomposes the owner from a per-component choice, which is exact for the TRS part of each matrix; shear in either matrix cannot survive that decomposition.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans and two node ids with no influence or offset field, because `applyParent` implements a hard snap and the record holds only what that solver reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No owner or parent is special-cased; snapping without an offset is the stated contract rather than a hidden compensation, and non-boolean flags throw instead of being coerced.
 * @evidence contracts/common.md#meaningful-documentation States the world-space pass, the per-component replacement, the missing influence and offset, that limits do not apply, and the flag failure.
 * @author Samchon
 */
export interface IAutoMovieParentDriver {
  /** Discriminator. */
  type: "parent";

  /** Node that follows. */
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
