/**
 * Parent an owner to another node as a relationship (Child-Of), per-component.
 */
export interface IAutoMovieParentDriver {
  /** Discriminator. */
  type: "parent";

  /** Node that follows. */
  owner: string;

  /** Node followed. */
  parent: string;

  /** Which components of the parent frame are inherited. */
  translation: boolean;

  /** Whether the owner inherits the parent rotation. */
  rotation: boolean;

  /** Whether the owner inherits the parent scale. */
  scale: boolean;
}
