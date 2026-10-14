import { IAutoMovieCaptureRuntimeIdentity, IAutoMovieSubjectReviewObservation, IAutoMovieSubjectReviewTarget } from "@automovie/interface";
import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";

/**
 * Persist one per-view passed capture record with repeated exact context and runtime metadata.
 *
 * @evidence contracts/common.md#principled-implementation Outer fields and portable observation repeat target, revision, plan, attempt, pose and runtime for exact join admission.
 * @evidence contracts/common.md#clear-and-simple-design Per-view record semantics stay separate from the overall attempt journal verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A record can be written before later runtime refusal leaves it outside journal membership; passed here does not certify whole-sweep completion or visible anatomy.
 * @evidence contracts/common.md#meaningful-documentation Artifact digest and encoded attempt/viewpoint address are rechecked by the reader before coverage projection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Schema/canonical joins and artifact hashing execute in the parsers/verifier.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One receipt shape supplies publisher and reader joins instead of an independently inferred historical context.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Serialized records/images persist with inspection history; this type owns no cleanup or retention cap.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionObservationRecord {
  /** Record format. */
  version: 2;

  /** Production namespace the observation was captured in. */
  productionId: string;

  /** Exact artifact-qualified subject target. */
  target: IAutoMovieSubjectReviewTarget;

  /** Exact compiled subject revision. */
  revision: string;

  /** Receipt in the shape subject coverage counts. */
  observation: IAutoMovieSubjectReviewObservation;

  /** Camera state the artifact was drawn through. */
  pose: IAutoMovieSubjectInspectionPose;

  /** Compile the observation was derived from. */
  compileFingerprint: string;

  /** Canonical ordered whole-plan identity. */
  planIdentity: string;

  /** Sweep attempt this record belongs to. */
  attempt: number;

  /** Planned viewpoint identity repeated outside the portable receipt. */
  viewpoint: string;

  /** Complete actual capture runtime, including inspected graphics. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;

  /** Per-view success marker; the overall attempt journal verdict is separate. */
  verdict: "passed";

  /** Never delivery evidence, and typed so it cannot become it. */
  deliveryEvidence: false;
}
