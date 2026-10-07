import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * The existing pelvifemoral scalar coordination result; only flexion increments are emitted here.
 *
 * @evidence contracts/common.md#principled-implementation Carries copied joint rows and the narrower flexion-only increment population, preserving the original sagittal rhythm result without widening its axis set.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original sagittal rhythm result without widening its axis set; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The Omit/Record intersection retains only flexion contributions; copied joint rows are not widened to a second authority for abduction or twist.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source/document channel owners retain the original controls; this carrier adds no channel or coupling.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Joint rows and sagittal flexion increments remain degrees in the source joint convention; these increments precede final posed-frame readings.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Flexion increments retain resolveHumanBodyPelvifemoralRhythm source coordination; they do not establish an independently measured pelvis/femur physiological rhythm.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority The output preserves sagittal coordination of named authored joint rows and does not introduce a separate public scalar or anatomical reconstruction.
 * @author Samchon
 */
export interface IHumanBodyPelvifemoralResult {
  /** Copied source-pose rows with the declared sagittal coordination. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered flexion increments, distinct from final frame readings. */
  contributions: (Omit<IHumanBodyCouplingContribution, "axis"> &
    Record<"axis", "flexion">)[];
}
