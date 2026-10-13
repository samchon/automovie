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
 * cycle among them throws, as does an owner or source node that is not in the
 * frame.
 *
 * @evidence contracts/common.md#principled-implementation `resolveDrivers` topologically sorts copy and driven drivers by the channel keys each reads and writes, then `applyCopy` lerps translation and scale and slerps rotation between the owner's and source's sampled-or-rest local values and writes the owner's channel.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans select components instead of a component list, and the copy works on local values in the same sampled map clips write, so no world compose is needed before it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-boolean flags, an influence outside `[0, 1]`, a missing node, a sampled value of the wrong width and a dependency cycle all throw rather than being coerced, and the parent-local semantics are stated rather than hidden behind a world-space promise.
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
   * Blend factor `[0, 1]` between the owner's prior value (`0`) and the copied
   * one (`1`). A non-finite or out-of-range value throws.
   */
  influence: number;
}
