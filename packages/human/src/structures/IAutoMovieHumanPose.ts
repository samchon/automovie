import { AutoMovieHumanoidBone } from "@automovie/interface";
import { tags } from "typia";

/**
 * A static pose of one person, as named physiological motions per bone.
 *
 * Each entry names a bone of the shared humanoid vocabulary and its three clinical rotations in degrees, measured from the canonical rest pose: flexion and extension in the sagittal plane, abduction and adduction in the frontal plane, external and internal rotation about the bone's long axis. These are the motions goniometry measures, so a range of motion from the clinical literature applies to them directly. Bones not listed stay at rest.
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
     * Axial rotation in degrees: external (lateral) rotation positive, internal (medial) negative.
     */
    twist: number & tags.Minimum<-180> & tags.Maximum<180>;
  }
}
