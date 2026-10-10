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
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateBuild {
  /** The body builder's admitted static surface, with its actual finishes. */
  readonly model: IAutoMovieModel;

  /** Candidate-only qualification; no cohort certificate is inferred. */
  readonly exterior: IAutoMovieHumanBodyExteriorCandidateReport;
}
