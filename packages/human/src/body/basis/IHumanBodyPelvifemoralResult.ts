import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * The existing pelvifemoral scalar coordination result; only flexion increments are emitted here.
 *
 * @evidence contracts/common.md#principled-implementation Copied source joint rows accompany ordered contributions constrained structurally to flexion-only pelvifemoral scalar increments.
 * @evidence contracts/common.md#clear-and-simple-design The result reuses common coupling metadata and narrows only its axis; final frame readings stay separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sagittal scalar additions cannot substitute for actual pelvic-relative coordinate reconstruction or clinical motion admission.
 * @evidence contracts/common.md#meaningful-documentation Members state copied row ownership and flexion-only contributions distinct from performed-frame measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pelvifemoral result typing performs no pelvic tilt or coordinate reading algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The flexion-result carrier coordinates no equivalent coupled-pose cache across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Result metadata acquires no hip-line transform buffers or ongoing pelvic coordination task.
 * @author Samchon
 */
export interface IHumanBodyPelvifemoralResult {
  /** Copied source-pose rows with the declared sagittal coordination. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered flexion increments, distinct from final frame readings. */
  contributions: (Omit<IHumanBodyCouplingContribution, "axis"> &
    Record<"axis", "flexion">)[];
}
