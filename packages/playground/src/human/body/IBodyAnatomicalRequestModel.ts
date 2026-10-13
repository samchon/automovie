import type { IAutoMovieHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyExteriorCandidateBuild";

/**
 * The qualification a numerical request panel reads from a built frame.
 *
 * A frame may carry the candidate-only inspection report or the source-conditioned exterior candidate; the panel displays whichever is present and never treats either as a resolved clinical skin. The panel's build adapter requires exactly one matching qualification before publication; optional fields here alone do not establish that invariant.
 *
 * @evidence contracts/common.md#principled-implementation Qualification references the inspector's own report or exterior build output, preserving their candidate-only meanings; the panel checks uniqueness and basis identity before publishing a frame.
 * @evidence contracts/common.md#clear-and-simple-design The panel model exposes only the two qualification alternatives it displays, with actual frame construction and resource ownership left to the viewport adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither candidate representation is presented as resolved clinical skin, and structural optionality is not used as proof of unique or matching qualification.
 * @evidence contracts/common.md#meaningful-documentation The documentation distinguishes source-conditioned exterior from inspector candidates and locates the exactly-one admission check outside this interface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Qualification fields select no inspection algorithm and traverse no generated geometry; the inspector and exterior builder own that computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This qualification view implements no reuse across requests; the panel's intent and document checks control frame admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Candidate reports are data on a viewport-owned frame; the model interface allocates no handle and provides no independent retirement operation.
 *
 * @author Samchon
 */
export interface IBodyAnatomicalRequestModel {
  /** Candidate-only numerical inspection, when the frame came from the inspector. */
  anatomicalRequest?: IAutoMovieHumanBodyAnatomicalInspection;

  /** Actual source-conditioned exterior; never a resolved clinical skin. */
  exteriorCandidate?: IAutoMovieHumanBodyExteriorCandidateBuild["exterior"];
}
