import type { IAutoMovieCameraClearanceEnvelope, IAutoMovieStage } from "@automovie/interface";

/** Original clearance envelope and staging input constructors. */
export interface IFilmCameraClearanceStageInputs {
  /** Construct the original default envelope. */
  envelope(): IAutoMovieCameraClearanceEnvelope;

  /** Replace only the original stage camera envelope. */
  stageWithClearance(clearance: IAutoMovieCameraClearanceEnvelope): IAutoMovieStage;
}
