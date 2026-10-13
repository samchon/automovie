import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * Copied coupled source-pose rows and their ordered scalar increments; the pose resolver separately owns final frame admission.
 *
 * @evidence contracts/common.md#principled-implementation Copied coupled joint rows accompany ordered source increments without treating those scalars as reconstructed clinical frames.
 * @evidence contracts/common.md#clear-and-simple-design The result keeps source coordination outputs together while final frame admission remains pose-resolver-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coupled scalar rows do not bypass downstream frame/range admission or establish anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation Members state copied joint ownership and ordered increment provenance distinct from clinical reconstruction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Coupling-result typing executes no dependency ordering or degree accumulation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The output carrier stores no coupling evaluation equivalence or invalidation mechanism.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coupled rows and contribution arrays have no acquisition/release behavior in this schema.
 * @author Samchon
 */
export interface IHumanBodyCouplingResult {
  /** Existing copied and coupled source joint rows. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered source increments, with no clinical-frame reconstruction. */
  contributions: IHumanBodyCouplingContribution[];
}
