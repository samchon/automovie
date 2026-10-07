import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One existing source coupling's scalar degree addition, kept separate from final post-pelvis clinical coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Carries the source coupling ID, receiving bone/axis and signed degree increment, preserving one original source coordination increment rather than a final clinical-frame result.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only one original source coordination increment rather than a final clinical-frame result; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coupling ID, receiving bone and closed axis retain a signed scalar increment, separately from final post-pelvis clinical coordinates.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source/document channel owners retain the original controls; this carrier adds no channel or coupling.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions The increment is degrees on the named receiving flexion, abduction or twist axis; it is not a world-space displacement or final frame reading.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The increment records the declared source coupling convention, not a final measured joint angle or an independently established physiological rhythm.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority It preserves the source coupling's receiving named bone/axis and requested degree addition; it exposes no independent public deformation channel.
 * @author Samchon
 */
export interface IHumanBodyCouplingContribution {
  /** Source coupling identity. */
  coupling: string;

  /** Existing rig bone receiving the addition. */
  bone: AutoMovieHumanoidBone;

  /** Existing degree axis receiving the addition. */
  axis: "flexion" | "abduction" | "twist";

  /** Existing signed scalar increment, degrees. */
  degrees: number;
}
