import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMovieSubjectReviewPose } from "./IAutoMovieSubjectReviewPose";
import { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Receipt for one subject observation made from an inspection-owned viewpoint.
 *
 * The `kind` discriminator deliberately differs from frame evidence. A shot
 * capture therefore cannot satisfy subject coverage merely because it contains
 * the subject.
 *
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
  compileFingerprint: AutoMovieContentDigest;

  /** Canonical identity of the exact ordered plan and its poses. */
  planIdentity: AutoMovieContentDigest;

  /** Required viewpoint identity this observation answers. */
  viewpoint: string;

  /** Exact camera state used to draw the artifact. */
  pose: IAutoMovieSubjectReviewPose;

  /** Complete actual capture runtime, including the inspected graphics. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;

  /** Stable identity of the image or inspection artifact. */
  artifact: string;

  /** Content digest of the exact inspected artifact. */
  digest: AutoMovieContentDigest;

  /** Only a terminal passed observation can satisfy coverage. */
  verdict: "passed";

  /** Subject inspection is never delivery evidence. */
  deliveryEvidence: false;
}
