import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * One explicit target-radius articular head candidate in a reference rig.
 *
 * The candidate is an analytic sphere of the requested radius at the carrying
 * joint's reference rig centre. It names the whole bone it concerns but is not
 * that complete bone, and only an explicit target produces it.
 *
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
