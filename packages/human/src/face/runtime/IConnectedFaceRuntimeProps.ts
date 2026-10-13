import type { IAutoMovieHumanFaceBasis } from "../../index";
import type { IAutoMovieHumanFaceConstructionProgress } from "../structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * The admitted face basis one resident worker evaluates for preview and export.
 * The runtime owns compilation and document parsing; callers supply its basis.
 *
 * @author Samchon
 */
export interface IConnectedFaceRuntimeProps {
  /** Numerical basis compiled once by the resident runtime. */
  basis: IAutoMovieHumanFaceBasis;

  /** Actual completed owner boundaries, including refused admission; no timer or guessed progress. */
  progress?: (progress: IAutoMovieHumanFaceConstructionProgress) => void;
}
