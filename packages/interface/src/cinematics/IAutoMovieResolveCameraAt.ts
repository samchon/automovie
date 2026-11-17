import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Staged world transform used when camera animation omits a component.
 *
 * @evidence contracts/development/design.md#principled-representation IBase contains world-metre translation and local-to-world quaternion rotation; scene/caller admission owns finite unit-transform premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The camera resolver needs only the staged components that camera-node tracks can replace, so scale and renderer state are absent.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fallback is the authored component itself, with aliasing documented instead of hidden behind a copied-looking transform.
 * @evidence contracts/development/common.md#meaningful-documentation IBase defines component borrowing, null-clip behavior and sampled-track replacement.
 */
export namespace IAutoMovieResolveCameraAt {
  /**
   * Borrowed base placement for resolveCameraAt, before camera-node tracks replace translation or rotation at a shot-local instant.
   *
   * A move that lacks one of the two tracks takes that component from the base. Sampling follows {@link sampleClip}: time is clamped to the clip, or wrapped when it loops, and an invalid time or a duplicated track throws. A component taken from the base is the base's own object, not a copy.
   *
   * With a null camera clip, the resolver returns both references immediately without sampling or validating the requested time. The resolver never validates or normalizes the base transform; scene admission and callers own those premises.
   *
   * @evidence contracts/development/design.md#principled-representation Translation is world metres and rotation maps the camera's local -Z-forward frame to world. Only these components are resolved; scale is not a camera-pose channel here.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Camera projection, clearance and sound readers share this staged fallback while animation uses the canonical clip and sampled-channel contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing tracks preserve authored base components by reference instead of substituting identity or previous-frame state; no normalization is silently added.
   * @evidence contracts/development/common.md#meaningful-documentation Documents fallback per component, units, aliasing, clip time semantics and the null-clip validation exception.
   */
  export type IBase = {
    /** Staged lens position in world metres; returned by reference when no matching translation track is sampled. */
    translation: IAutoMovieVector3;

    /** Staged local-to-world camera quaternion, expected finite and unit length by geometric readers; returned by reference when no matching rotation track is sampled. */
    rotation: IAutoMovieQuaternion;
  };
}
