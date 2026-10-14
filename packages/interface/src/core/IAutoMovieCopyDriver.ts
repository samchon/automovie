/**
 * Copy enabled source parent-local transform components onto an owner.
 *
 * Channel-space execution precedes limits. Each enabled component blends sampled-or-rest local values by influence, with lerp for translation/scale and slerp for rotation. Matching local values gives matching world placement only under the same parent frame. Referenced nodes and sampled widths are checked when a component is read; disabling all components performs no node lookup. Numeric component finiteness and unit input rotations remain caller premises.
 *
 * @evidence contracts/common.md#principled-implementation `resolveDrivers` topologically sorts copy and driven drivers by the channel keys each reads and writes, then `applyCopy` lerps translation and scale and slerps rotation between the owner's and source's sampled-or-rest local values and writes the owner's channel.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans select components instead of a component list, and the copy works on local values in the same sampled map clips write, so no world compose is needed before it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonboolean flags, invalid influence, enabled-component reads of missing nodes and wrong sampled widths throw. Dependency ordering excludes a driver's own one-step input/output and refuses reciprocal cycles; finite derived blends are not separately gated, and local copying does not promise world-space agreement across different parents.
 * @evidence contracts/common.md#meaningful-documentation States the pass and its order relative to limits, what value the owner starts from, the blend per component, when the result matches in world space, and every throw.
 * @author Samchon
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
   * Blend factor [0, 1] between prior and copied values; nonfinite or out-of-range influence throws even when every component is disabled.
   */
  influence: number;
}
