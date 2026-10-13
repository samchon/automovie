import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * One explicit target-radius articular head candidate in a reference rig.
 *
 * The candidate is an analytic sphere of the requested radius at the carrying joint's reference rig centre. It names the whole bone it concerns but is not that complete bone, and only an explicit target produces it.
 *
 * @evidence contracts/common.md#principled-implementation A target-radius sphere at a neutral-rig joint separately marks its whole bone as unvalidated geometry.
 * @evidence contracts/common.md#clear-and-simple-design Part/carrier identity, metre geometry, target provenance and reference-only registration travel together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The candidate is neither complete bone nor imaging acquisition and placement certifies no validated surface.
 * @evidence contracts/common.md#meaningful-documentation Members state radius/centre units, bone-versus-candidate identity and personal-registration limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Candidate parameters perform no sphere tessellation or placement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference qualification is output provenance without a model-construction cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar/vector candidates own no tessellated mesh or retained articular renderer.
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
