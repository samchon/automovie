import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Data and callback contracts shared by the PoseJointCodec operations. */
export namespace IAutoMoviePoseJointCodec {
  /** The two maps of one rig. */
  export interface ICodec {
    /**
     * A bone's articulation, the rotation applied after its rest rotation,
     * from its clinical `[flexion, abduction, twist]` in degrees.
     */
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ) => IAutoMovieQuaternion;

    /**
     * A bone's clinical `[flexion, abduction, twist]` in degrees from its
     * unit articulation.
     */
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ) => [number, number, number];

    /**
     * Whether a bone's articulations fill a three-dimensional set of
     * rotations: its effective range of motion is absent or moves all three
     * axes. A hinge or a two-axis joint is not one; a rotation composed from
     * two of its articulations generally leaves the set its angles span, so
     * such a joint is differenced and blended on its own angles. Every bone
     * is one without a rig, where no range is read.
     */
    ball: (bone: AutoMovieHumanoidBone) => boolean;
  }
}
