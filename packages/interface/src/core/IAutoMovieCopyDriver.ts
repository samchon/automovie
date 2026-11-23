/**
 * Copy enabled source parent-local transform components onto an owner.
 *
 * Channel-space execution precedes limits. Each enabled component blends
 * sampled-or-rest local values by influence, with lerp for translation/scale
 * and slerp for rotation. Matching local values gives matching world placement
 * only under the same parent frame. Referenced nodes and sampled widths are
 * checked when a component is read; disabling all components performs no node
 * lookup. Numeric component finiteness and unit input rotations remain caller
 * premises.
 */
export interface IAutoMovieCopyDriver {
  /** Discriminator. */
  type: "copy";

  /** Node whose transform is written. */
  owner: string;

  /** Node whose transform is read. */
  source: string;

  /** Whether the owner copies the source's local translation. */
  translation: boolean;

  /** Whether the owner copies the source's local rotation. */
  rotation: boolean;

  /** Whether the owner copies the source's local scale. */
  scale: boolean;

  /**
   * Blend factor [0, 1] between prior and copied values; nonfinite or
   * out-of-range influence throws even when every component is disabled.
   */
  influence: number;
}
