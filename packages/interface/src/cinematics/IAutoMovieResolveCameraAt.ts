import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Staged world transform used when camera animation omits a component. */
export namespace IAutoMovieResolveCameraAt {
  /**
   * Borrowed base placement for resolveCameraAt, before camera-node tracks
   * replace translation or rotation at a shot-local instant.
   *
   * A move that lacks one of the two tracks takes that component from the base.
   * Sampling follows {@link sampleClip}: time is clamped to the clip, or wrapped
   * when it loops, and an invalid time or a duplicated track throws. A
   * component taken from the base is the base's own object, not a copy.
   *
   * With a null camera clip, the resolver returns both references immediately
   * without sampling or validating the requested time. The resolver never
   * validates or normalizes the base transform; scene admission and callers own
   * those premises.
   */
  export type IBase = {
    /**
     * Staged lens position in world metres; returned by reference when no
     * matching translation track is sampled.
     */
    translation: IAutoMovieVector3;

    /**
     * Staged local-to-world camera quaternion, expected finite and unit length
     * by geometric readers; returned by reference when no matching rotation
     * track is sampled.
     */
    rotation: IAutoMovieQuaternion;
  };
}
