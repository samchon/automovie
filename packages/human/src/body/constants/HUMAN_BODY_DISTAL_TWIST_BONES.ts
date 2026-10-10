import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The body bones whose twist is distal (`AutoMovieJointTwistPlacement`): the
 * axial rotation happens in the moved segment beyond the swing.
 *
 * The forearm pronates and supinates about its own long axis, distal to the
 * elbow's hinge: the radius turns about the ulna while the humeroulnar hinge
 * stays with the humerus. So a bent forearm that twists keeps pointing where
 * the hinge put it. Every other body bone keeps the engine's proximal
 * default. Two candidates remain open with their grounds: the femur's axial
 * rotation and the glenohumeral axial rotation are distal in the ISB joint
 * coordinate conventions (Wu et al. 2002, 2005), but the thigh's stored goals
 * and pelvifemoral rhythm were authored in the proximal order and the upper
 * arm moves by its thorax-relative goal, so neither is changed here.
 *
 * @author Samchon
 */
export const HUMAN_BODY_DISTAL_TWIST_BONES: readonly AutoMovieHumanoidBone[] = [
  "leftLowerArm",
  "rightLowerArm",
];
