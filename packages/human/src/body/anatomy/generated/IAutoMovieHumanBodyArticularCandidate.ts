import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * One explicit target-radius articular head candidate in a reference rig.
 *
 * The candidate is an analytic sphere of the requested radius at the carrying
 * joint's reference rig centre. It names the whole bone it concerns but is not
 * that complete bone, and only an explicit target produces it.
 *
 * @evidence contracts/common.md#principled-implementation A candidate keeps its own identity and unavailable part resolution, so a mathematical sphere cannot certify an observed surface.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the inspection report's anonymous candidate element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cohort, error or tissue surface is invented for the candidate.
 * @evidence contracts/common.md#meaningful-documentation States the sphere's source, placement and qualification limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping The candidate names the whole bone it concerns and its carrying rig joint.
 * @evidence contracts/modeling.md#parameter-channels Each explicit target radius remains independent on its anatomical side.
 * @evidence contracts/modeling.md#spatial-conventions The centre and radius are metres in the right-handed Y-up, Z-forward, anatomical-left +X reference frame.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The candidate model owner creates the sphere mesh.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The candidate constructs no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The candidate model owner observes the displayed mesh.
 * @evidence contracts/anatomy.md#parametric-authority The candidate originates in an explicitly named sphere-fitted-radius target, not a personal centre or vertex.
 * @evidence contracts/anatomy.md#anatomical-source A rig centre is a source approximation and does not establish a person's imaging centre or tissue boundary.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inspector owns target admission.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularCandidate {
  /** Whole bone the candidate concerns, not that complete bone itself. */
  part: "leftHumerus" | "rightHumerus" | "leftFemur" | "rightFemur";

  /** Rig joint carrying the candidate centre. */
  bone: "leftUpperArm" | "rightUpperArm" | "leftUpperLeg" | "rightUpperLeg";

  /** Sphere centre at the carrying joint's reference rig centre, in metres. */
  center: IAutoMovieVector3;

  /** Requested sphere-fitted target radius, in metres. */
  radiusMetres: number;

  /** An explicit target, not an imaging acquisition. */
  source: "target";

  /** Placement uses the reference rig and certifies no personal registration. */
  registration: "reference-rig-only";

  /** The candidate supplies no validated complete bone surface. */
  partResolution: IAutoMovieHumanBodyUnvalidatedGeometry;
}
