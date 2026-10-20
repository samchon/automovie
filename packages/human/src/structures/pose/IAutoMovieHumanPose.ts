import { IAutoMovieHumanJointPose } from "./IAutoMovieHumanJointPose";

/**
 * A static pose of one person, as named physiological motions per bone.
 *
 * Each entry names a bone of the shared humanoid vocabulary and its three rotations in degrees, measured from the canonical rest pose: flexion and extension in the sagittal plane, abduction and adduction in the frontal plane, and axial rotation about the bone's long axis. These are the motions goniometry measures, so a range of motion from the clinical literature applies to them directly. Each is signed about the bone's declared axes, which follow the engine's humanoid axis table (`HUMANOID_JOINT_AXES`) on the arms, so one pose value means the same motion on this person as on any other humanoid, such as the stickman, and motion transfers between them unchanged. Bones not listed stay at rest.
 *
 * The document requires unique bones and physiologically valid joint angles. No admission or pose conversion implementation is supplied.
 */
export interface IAutoMovieHumanPose {
  /** Articulated joints, each bone at most once. */
  joints: IAutoMovieHumanJointPose[];
}
