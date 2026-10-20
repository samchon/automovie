import { AutoMovieHumanoidBone } from "@automovie/interface";
import { tags } from "typia";

/**
 * The rotations of one joint from rest.
 *
 * Zero on every axis is the rest pose. An axis the joint cannot move, such as abduction of the elbow, admits only zero.
 */
export interface IAutoMovieHumanJointPose {
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
