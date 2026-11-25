import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** The two maps of one rig. */
export namespace IAutoMoviePoseJointCodec {
  /** The two maps of one rig. */
  export interface ICodec {
    /**
     * A bone's articulation, the rotation applied after its rest rotation, from
     * its clinical `[flexion, abduction, twist]` in degrees.
     *
     * The codec uses its retained rig axes and rest frames. Supply finite
     * clinical angles; the synchronous conversion returns a fresh quaternion
     * and leaves the tuple unchanged. Errors propagate; keep rig tables stable
     * throughout the codec lifetime.
     */
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ) => IAutoMovieQuaternion;

    /**
     * A bone's clinical `[flexion, abduction, twist]` in degrees from its unit
     * articulation.
     *
     * The synchronous inverse reads the same retained rig convention and picks
     * the equivalent angle chart best admitted by ROM; it does not clamp an
     * impossible rotation. Supply a unit quaternion, borrowed without mutation.
     * The returned triple is fresh and errors propagate.
     */
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ) => [number, number, number];

    /**
     * Whether a bone's articulations fill a three-dimensional set of rotations:
     * its effective range of motion is absent or moves all three axes. A hinge
     * or a two-axis joint is not one; a rotation composed from two of its
     * articulations generally leaves the set its angles span, so such a joint
     * is differenced and blended on its own angles. Every bone is one without a
     * rig, where no range is read.
     *
     * This synchronous predicate reads the codec's retained effective ROM
     * table; it performs no pose write or angular conversion. Releasing the
     * codec releases its table references; callers keep the rig stable while
     * using the codec.
     */
    ball: (bone: AutoMovieHumanoidBone) => boolean;
  }
}
