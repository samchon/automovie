/**
 * Parent an owner to another node as a relationship (Child-Of), per-component.
 *
 * Resolved in the world-space pass: each enabled component of the owner's world
 * transform is replaced by the parent node's world component, the others keep
 * the owner's composed values, and the owner's subtree recomposes. There is no
 * influence and no kept offset, so an enabled component snaps the owner onto
 * the parent, and limits never clamp the result. A non-boolean flag throws.
 *
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
