import { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMovieSubjectReviewPose } from "./IAutoMovieSubjectReviewPose";
import { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Receipt for one subject observation made from an inspection-owned viewpoint.
 *
 * The distinct subject-view kind and deliveryEvidence false keep subject inspection separate from delivered film-frame evidence.
 *
 * @evidence contracts/common.md#principled-implementation A passed observation binds exact target and subject revision to current compile, ordered viewpoint plan, camera pose, actual capture runtime and inspected artifact bytes; production reopens records and artifacts before coverage classification.
 * @evidence contracts/common.md#clear-and-simple-design The receipt carries provenance for one inspection-owned viewpoint without claiming screenplay time or delivery eligibility, which belong to film-frame evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shot capture cannot satisfy subject coverage merely by containing the subject; stale revision, plan or runtime and changed artifact bytes remain ineligible rather than being normalized to current observations.
 * @evidence contracts/common.md#meaningful-documentation Defines production and artifact-qualified target, current revision/compile/plan/runtime identities, exact camera and image digest, terminal verdict and delivery exclusion.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewObservation {
  /** Evidence discriminator; a frame receipt has another kind. */
  kind: "subject-view";

  /** Production namespace that owns the inspection. */
  productionId: string;

  /** Exact artifact-qualified subject target. */
  target: IAutoMovieSubjectReviewTarget;

  /** Exact compiled subject identity observed. */
  subject: string;

  /** Compiled artifact revision from which the observation was rendered. */
  revision: string;

  /** Current source compile identity used for the observation. */
  compileFingerprint: string;

  /** Canonical identity of the exact ordered plan and its poses. */
  planIdentity: string;

  /** Required viewpoint identity this observation answers. */
  viewpoint: string;

  /** Exact camera state used to draw the artifact. */
  pose: IAutoMovieSubjectReviewPose;

  /** Complete actual capture runtime, including the inspected graphics. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;

  /** Stable identity of the image or inspection artifact. */
  artifact: string;

  /** Content digest of the exact inspected artifact. */
  digest: string;

  /** Only a terminal passed observation can satisfy coverage. */
  verdict: "passed";

  /** Subject inspection is never delivery evidence. */
  deliveryEvidence: false;
}
