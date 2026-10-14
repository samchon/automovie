import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyExteriorCandidateReport } from "./IAutoMovieHumanBodyExteriorCandidateReport";

/**
 * A physical source-conditioned exterior beside its anatomical availability.
 *
 * The resident model meets the admitted bound surface targets, each read back on its emitted skin after Float32 quantization. It is not GeneratedSkin: internal tissues and held-out clinical geometry remain unavailable; the anatomical report preserves each part owner's separate qualification. The report carries no replay weights or editable source witness ordinals.
 *
 * @evidence contracts/common.md#principled-implementation An admitted static model accompanies source-conditioned exterior qualification after target readback on emitted Float32 skin.
 * @evidence contracts/common.md#clear-and-simple-design Geometry/report share one build while internal owners retain separate anatomical qualifications.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The model is not validated GeneratedSkin, and reports expose no editable weights/source witnesses.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish actual finishes, fulfilled physical targets and unavailable internal/clinical geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Candidate-build outputs perform no skin solving or export quantization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A paired model/report defines no cross-request body-build cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resident arrays belong to their builder; the interface allocates no GPU or running target process.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateBuild {
  /** The body builder's admitted static surface, with its actual finishes. */
  readonly model: IAutoMovieModel;

  /** Candidate-only qualification; no cohort certificate is inferred. */
  readonly exterior: IAutoMovieHumanBodyExteriorCandidateReport;
}
