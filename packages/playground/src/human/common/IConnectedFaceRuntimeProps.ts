import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import type { IAutoMovieHumanFaceConstructionProgress } from "@automovie/human/face/structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * The admitted face basis one resident worker evaluates for preview and export.
 * The runtime owns compilation and document parsing; callers supply its basis.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies the shared basis consumed by both preview and committed export.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Names the numerical runtime's basis input independently of its request envelope.
 * @author Samchon
 */
export interface IConnectedFaceRuntimeProps {
  /** Numerical basis compiled once by the resident runtime. */
  basis: IAutoMovieHumanFaceBasis;

  /** Actual completed owner boundaries, including refused admission; no timer or guessed progress. */
  progress?: (progress: IAutoMovieHumanFaceConstructionProgress) => void;
}
