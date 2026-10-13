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
