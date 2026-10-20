import { AutoMovieHumanoidBone } from "@automovie/interface";
import { tags } from "typia";

/**
 * The rotations of one joint from rest.
 *
 * Zero on every axis denotes the declared rest pose. An axis the joint cannot move, such as abduction of the elbow, admits only zero. The shared numeric bounds do not establish a joint's physiological range.
 */
export interface IAutoMovieHumanJointPose {
  /** The bone whose joint with its parent rotates. */
  bone: AutoMovieHumanoidBone;

  /** Sagittal rotation in degrees: flexion positive, extension negative. */
  flexion: number & tags.Minimum<-180> & tags.Maximum<180>;

  /** Frontal rotation in degrees: abduction positive, adduction negative. */
  abduction: number & tags.Minimum<-180> & tags.Maximum<180>;

  /**
   * Axial rotation in degrees about the bone's long axis, with these motion-direction conventions relative to the declared rest:
   *
   * - upper arm: internal (medial) rotation positive on both sides;
   * - forearm: pronation positive and supination negative on both sides;
   * - thigh: outward (external) rotation positive on each side;
   * - spine, neck and head: turning to the person's left positive.
   */
  twist: number & tags.Minimum<-180> & tags.Maximum<180>;
}
