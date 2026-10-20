import { IAutoMovieHumanJointPose } from "./IAutoMovieHumanJointPose";

/**
 * A static pose of one person, as rest-relative joint coordinates per bone.
 *
 * Each entry names a bone of the shared humanoid vocabulary and its three rotations in degrees. The receiving convention must specify the rest posture, local axes and rotation order; this record alone does not identify them. Bones not listed stay at that declared rest.
 *
 * Clinical ranges of motion describe capacity under their own neutral posture and measurement protocol. Converting them to these coordinates, or transferring coordinates between rest frames, requires a separately established mapping. The document requires unique bones and joint-specific admissible motions; no admission or pose conversion implementation is supplied.
 */
export interface IAutoMovieHumanPose {
  /** Articulated joints, each bone at most once. */
  joints: IAutoMovieHumanJointPose[];
}
