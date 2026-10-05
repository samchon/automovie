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
 * @evidence contracts/common.md#principled-implementation Declares the joint fact that fixes the forearm's composition order instead of correcting its poses.
 * @evidence contracts/common.md#clear-and-simple-design One list, read by the skeleton resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pose value is rewritten to hide the composition order.
 * @evidence contracts/common.md#meaningful-documentation States the anatomy, the default and the two open candidates with their grounds.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels The forearm's twist channel keeps its clinical meaning, axial rotation of the forearm, in every flexion.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The twist is about the moved bone's own rest long axis, Y.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The posed skin owns observation.
 * @evidence contracts/anatomy.md#anatomical-source Forearm rotation is radioulnar, distal to the humeroulnar hinge; the ISB conventions are cited for the open candidates.
 * @evidenceExclude contracts/anatomy.md#permitted-range The joint constraints own the range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export const HUMAN_BODY_DISTAL_TWIST_BONES: readonly AutoMovieHumanoidBone[] = ["leftLowerArm", "rightLowerArm"];
