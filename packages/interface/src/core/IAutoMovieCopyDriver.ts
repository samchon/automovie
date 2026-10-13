/** Copy a source node's transform components onto an owner (mirror, follow). */
export interface IAutoMovieCopyDriver {
  /** Discriminator. */
  type: "copy";

  /** Node whose transform is written. */
  owner: string;

  /** Node whose transform is read. */
  source: string;

  /** Which components to copy. */
  translation: boolean;

  /** Whether the owner copies the source rotation. */
  rotation: boolean;

  /** Whether the owner copies the source scale. */
  scale: boolean;

  /**
   * Blend factor `[0, 1]` between the owner's prior value and the copied one.
   */
  influence: number;
}
