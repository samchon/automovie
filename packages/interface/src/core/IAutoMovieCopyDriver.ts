/**
 * Copy a source node's parent-local transform components onto an owner
 * (mirror, follow).
 *
 * Resolved in the channel-space pass, before channel limits clamp: for each
 * enabled component the owner's current local value (its sampled channel, else
 * its rest transform) moves toward the source's by `influence`, linearly for
 * translation and scale and by slerp for rotation. Because both values are
 * parent-local, the owner matches the source in world space only when the two
 * share a parent frame. Copy and driven drivers run in dependency order, and a
 * cycle among them throws.
 *
 * @evidence contracts/common.md#principled-implementation Component-wise blend of local TRS arrays, lerp for translation and scale and `Quaternion.slerp` for rotation, read from the sampled map or the node's rest transform and written back as the owner's channel, so copy chains settle in one topological pass.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans select components independently instead of an enum of combinations, and the driver writes the owner's own channel keys so the existing limit pass clamps the copied value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node is special-cased; a missing owner or source node, a non-boolean flag, a sampled value of the wrong width or an influence outside `[0, 1]` throws instead of being skipped.
 * @evidence contracts/common.md#meaningful-documentation States that the copy is parent-local, the blend rule per component, when it runs relative to limits, and the cycle and validation failures.
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
   * Blend factor `[0, 1]` between the owner's prior value (`0`) and the copied
   * one (`1`). A non-finite or out-of-range value throws.
   */
  influence: number;
}
