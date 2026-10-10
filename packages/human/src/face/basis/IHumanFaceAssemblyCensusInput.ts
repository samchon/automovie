import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";

/**
 * What the face assembly census reads: the compiled basis, the evaluated pose
 * that produced the model, and the complete model itself.
 *
 * The model is held by reference and read when admission runs, after hair has
 * been composed, so the census covers every part the consumer receives.
 *
 * @author Samchon
 */
export interface IHumanFaceAssemblyCensusInput {
  /** Compiled source basis whose surfaces and registrations name the references. */
  basis: IAutoMovieHumanFaceBasis;

  /** Evaluated pose: final positions, generated optics and the oral assembly. */
  pose: IHumanFacePoseResult;

  /** Complete constructed model, read when admission runs. */
  model: IAutoMovieModel;
}
