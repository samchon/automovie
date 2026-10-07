import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyExteriorCandidateReport } from "./IAutoMovieHumanBodyExteriorCandidateReport";

/**
 * A physical source-conditioned exterior beside its anatomical availability.
 *
 * The resident model meets the admitted bound surface targets, each read back
 * on its emitted skin after Float32 quantization. It is not GeneratedSkin:
 * internal tissues and held-out clinical geometry remain unavailable; the
 * anatomical report preserves each part owner's separate qualification.
 * The report carries no replay weights or editable source witness ordinals.
 *
 * @evidence contracts/common.md#principled-implementation Separates actual surface measurements from independent anatomical validation.
 * @evidence contracts/common.md#clear-and-simple-design One model and one report travel together to preview and export consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested context is retained without population means or false resolved tissue.
 * @evidence contracts/common.md#meaningful-documentation States the physical candidate and clinical availability distinction.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateBuild {
  /** The body builder's admitted static surface, with its actual finishes. */
  readonly model: IAutoMovieModel;

  /** Candidate-only qualification; no cohort certificate is inferred. */
  readonly exterior: IAutoMovieHumanBodyExteriorCandidateReport;
}
