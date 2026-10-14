import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One bone placement in body space: its head and world orientation. The
 * transform pair uses this representation for both shaped rest and posed frames.
 *
 * @evidence contracts/common.md#principled-implementation A metre-valued head point and quaternion identify a bone placement in body space.
 * @evidence contracts/common.md#clear-and-simple-design The frame record contains only translation and orientation needed by the transform pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The represented rig frame is not a sampled anatomical bone surface.
 * @evidence contracts/common.md#meaningful-documentation Members specify body-space position and quaternion orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bone world frame record declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The bone world frame record declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bone world frame record type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneWorldRest {
  /** The bone's head in body space, metres. */
  position: IAutoMovieVector3;

  /** The bone's orientation in body space. */
  rotation: IAutoMovieQuaternion;
}
