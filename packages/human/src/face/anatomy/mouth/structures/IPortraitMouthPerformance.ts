import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Oral aperture performance in millimetres, independent of vermilion thickness.
 * The observed separation calibrates the complete observed aperture profile;
 * zero current separation closes both rims onto one paired three-dimensional seam.
 *
 * @evidence contracts/common.md#principled-implementation Performance is stated as observed and current pairs for each motion, so the change applied to the observed face is the difference and an unchanged pair reproduces the observation exactly; the mandibular hinge is an authored transverse axis with an angle, which is the rigid rotation the jaw's motion reduces to at this fidelity.
 * @evidence contracts/common.md#clear-and-simple-design One optional block per motion; nothing is added for a motion the face does not perform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit, its admitted range, the frame of the hinge and what omission means.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres in the head frame, the hinge is a head-frame point with a +X axis, and angles are degrees about it, positive opening inferiorly.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is one set of performance amounts and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; the paired-margin construction in `createPortraitMouthPerformance` keeps the two lip rims on one seam when the separation is zero.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint; the performance it describes is observed on the parts that consume it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; the ranges in its JSDoc are enforced by `createPortraitMouthPerformance` and `posePortraitJawPoint`.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named motion: central lip separation, mandibular rotation about a named hinge, commissure elevation on each side, and lip protrusion. None addresses a vertex, curve or patch.
 * @author Samchon
 */
export interface IPortraitMouthPerformance {
  /** Current central lip separation in [0,30] mm, before mandibular rotation. */
  lipPart: number;

  /** Central separation represented by the basis in [0,30] mm. Zero requires a coincident observed seam. */
  observedLipPart: number;

  /** Optional observed/current mandibular rotation about an authored transverse hinge. Omission is a stationary jaw. */
  jaw?: {
    /** Hinge centre in head-frame millimetres; the hinge axis is +X. */
    hinge: IAutoMovieVector3;

    /** Current inferior opening in [0,25] degrees. */
    current: number;

    /** Inferior opening already in the observed lower lip, in [0,25] degrees. */
    observed: number;
  };

  /** Optional signed changes in commissure elevation, in [-13,13] mm; zero preserves the observed smile. */
  smile?: { right: number; left: number };

  /** Optional observed/current protrusion in [0,4] mm, coupled to six percent narrowing per millimetre. */
  pucker?: { current: number; observed: number };
}
