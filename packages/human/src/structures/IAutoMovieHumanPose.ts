import { AutoMovieHumanoidBone } from "@automovie/interface";
import { tags } from "typia";

/**
 * A static pose of one person, as named physiological motions per bone.
 *
 * Each entry names a bone of the shared humanoid vocabulary and its three rotations in degrees, measured from the canonical rest pose: flexion and extension in the sagittal plane, abduction and adduction in the frontal plane, and axial rotation about the bone's long axis. These are the motions goniometry measures, so a range of motion from the clinical literature applies to them directly. Each is signed about the bone's declared axes, which follow the engine's humanoid axis table (`HUMANOID_JOINT_AXES`) on the arms, so one pose value means the same motion on this person as on any other humanoid, such as the stickman, and motion transfers between them unchanged. Bones not listed stay at rest.
 *
 * Admission refuses a bone the person's skeleton lacks, a bone listed twice, and an angle outside the person's range of motion, naming the joint, the limit and its cause. Posing converts the document into the engine's pose for films.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPose {
  /** Document version. Saved documents of another version are not migrated. */
  version: 1;

  /** Articulated joints, each bone at most once. */
  joints: IAutoMovieHumanPose.IJoint[];
}
export namespace IAutoMovieHumanPose {
  /**
   * The rotations of one joint from rest.
   *
   * Zero on every axis is the rest pose. An axis the joint cannot move, such as abduction of the elbow, admits only zero.
   *
   * @author Samchon
   */
  export interface IJoint {
    /** The bone whose joint with its parent rotates. */
    bone: AutoMovieHumanoidBone;

    /** Sagittal rotation in degrees: flexion positive, extension negative. */
    flexion: number & tags.Minimum<-180> & tags.Maximum<180>;

    /** Frontal rotation in degrees: abduction positive, adduction negative. */
    abduction: number & tags.Minimum<-180> & tags.Maximum<180>;

    /**
     * Axial rotation in degrees about the bone's long axis. Its sign is the declared axis's, which reads differently by joint:
     *
     * - upper arm: internal (medial) rotation positive on both sides;
     * - forearm: pronation positive and supination negative on both sides, so the palm-forward anatomical position is a twist of -90 from the palm-down rest;
     * - thigh: outward (external) rotation positive on each side;
     * - spine, neck and head: turning to the person's left positive.
     *
     * Both arms share the engine's twist axis, +X in the T-pose rest (`HUMANOID_JOINT_AXES`), and a right-handed turn about it rolls either arm's thumb downward, which is what fixes the arm's signs. The elbow convention of the International Society of Biomechanics is reported with pronation positive as well (as documented by the qmt joint-angle library after Wu et al. 2005, J Biomech 38(5):981-992; the recommendation itself was not read).
     */
    twist: number & tags.Minimum<-180> & tags.Maximum<180>;
  }
}
