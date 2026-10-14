import { IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";

/**
 * Persist one ordered v2 inspection denominator with its exact compiled context and poses.
 *
 * @evidence contracts/common.md#principled-implementation Production, target, revision, compile fingerprint, ordered viewpoints/poses and canonical identity bind one stored plan.
 * @evidence contracts/common.md#clear-and-simple-design Publisher and reopen verifier use the same record rather than reconstructing a denominator from captured prefixes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema does not freeze arrays or independently prove physical viewpoints; parser admission checks representation and context identity.
 * @evidence contracts/common.md#meaningful-documentation The record always names the inspection lane with deliveryEvidence false and preserves plan order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Plan construction, canonical serialization and admission execute in their function owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same stored denominator serves capture and reopen, without a cache implemented by this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher/callers own the arrays and stored JSON; this erased schema acquires no image or filesystem handle.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionPlanRecord {
  /** Record format. */
  version: 2;

  /** Production namespace the inspection ran in. */
  productionId: string;

  /** Compiled artifact and compiled subject id the plan was laid out for. */
  target: IAutoMovieSubjectReviewTarget;

  /** Revision of the compiled artifact the plan was derived from. */
  revision: string;

  /** Compile the plan and its observations were derived from. */
  compileFingerprint: string;

  /** Canonical digest of every ordered plan and current-context member. */
  planIdentity: string;

  /** Viewpoints the inspection undertook to observe, in plan order. */
  planned: IAutoMovieSubjectReviewViewpoint[];

  /** Exact camera pose paired with every viewpoint in plan order. */
  poses: IAutoMovieSubjectInspectionPose[];

  /** Never delivery evidence, and typed so it cannot become it. */
  deliveryEvidence: false;
}
