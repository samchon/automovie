import type { IAutoMovieHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyExteriorCandidateBuild";

/**
 * The qualification a numerical request panel reads from a built frame.
 *
 * A frame may carry the candidate-only inspection report or the
 * source-conditioned exterior candidate; the panel displays whichever is
 * present and never treats either as a resolved clinical skin.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exposes the candidate qualification the numerical request panel displays with each frame.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps the inspection report and exterior candidate distinct from a resolved whole-body skin.
 * @author Samchon
 */
export interface IBodyAnatomicalRequestModel {
  /** Candidate-only numerical inspection, when the frame came from the inspector. */
  anatomicalRequest?: IAutoMovieHumanBodyAnatomicalInspection;

  /** Actual source-conditioned exterior; never a resolved clinical skin. */
  exteriorCandidate?: IAutoMovieHumanBodyExteriorCandidateBuild["exterior"];
}
