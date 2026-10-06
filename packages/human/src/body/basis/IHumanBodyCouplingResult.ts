import type { IAutoMovieJointPose } from "@automovie/interface";
import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * Copied coupled source-pose rows and their ordered scalar increments; the pose resolver separately owns final frame admission.
 *
 * @evidence contracts/common.md#principled-implementation Carries copied coupled joint rows and their ordered increment records, preserving the original shared source coupling result.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original shared source coupling result; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copied joint rows and ordered contributions remain distinct; the result does not silently overwrite the caller rows or claim final-frame clinical coordinates.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source/document channel owners retain the original controls; this carrier adds no channel or coupling.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Joint rows and signed contributions retain degrees in the source joint convention; this result carries no metre translation.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Copied rows and increments retain resolveHumanBodyCouplings source conventions; they do not constitute final-frame measurements or personal motion capacity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority The result preserves the named document motion channels and ordered source coordination; final pose admission remains at the pose resolver.
 * @author Samchon
 */
export interface IHumanBodyCouplingResult {
  /** Existing copied and coupled source joint rows. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered source increments, with no clinical-frame reconstruction. */
  contributions: IHumanBodyCouplingContribution[];
}
