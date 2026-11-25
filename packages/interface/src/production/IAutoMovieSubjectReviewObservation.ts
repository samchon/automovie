import type { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import type { IAutoMovieSubjectReviewPose } from "./IAutoMovieSubjectReviewPose";
import type { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Receipt for one subject observation made from an inspection-owned viewpoint.
 *
 * The distinct subject-view kind and deliveryEvidence false keep subject
 * inspection separate from delivered film-frame evidence.
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
