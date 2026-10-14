import { IAutoMovieSubjectReviewObservation } from "@automovie/interface";

import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";

/**
 * Return one admitted per-view pose, artifact address, digest, raster and portable observation.
 *
 * @evidence contracts/common.md#principled-implementation Viewpoint identity joins its current pose and emitted bytes to one portable subject-view receipt.
 * @evidence contracts/common.md#clear-and-simple-design The sweep keeps this result separate from its stored v2 observation record and whole denominator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned prefix can belong to a failed whole sweep, and metadata does not independently certify visible content.
 * @evidence contracts/common.md#meaningful-documentation Image addresses are project-relative, sizes pixels and digest exact written bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms PNG decode/hash/publication execute in the sweep and file owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One admitted receipt is reused in coverage projection rather than another draw.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Results retain pose/observation records while image bytes persist separately on disk; this type owns no pixel cache.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionView {
  /**
   * Viewpoint identity from the plan this observation answers.
   */
  viewpoint: string;

  /**
   * Camera state the image was drawn through.
   */
  pose: IAutoMovieSubjectInspectionPose;

  /**
   * Project-relative PNG the host instrument produced.
   */
  path: string;

  /**
   * Exact digest of the written PNG bytes.
   */
  digest: string;

  /**
   * Decoded pixel width.
   */
  width: number;

  /**
   * Decoded pixel height.
   */
  height: number;

  /**
   * Receipt in the shape subject coverage counts.
   */
  observation: IAutoMovieSubjectReviewObservation;
}
