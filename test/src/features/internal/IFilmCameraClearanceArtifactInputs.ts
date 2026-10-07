import type {
  IAutoMoviePerformedShot,
  IAutoMovieStagedSet,
} from "@automovie/engine";

/** Existing successful performance and staged set for artifact identity assertions. */
export interface IFilmCameraClearanceArtifactInputs {
  /** The original accepted performed shot. */
  performed: IAutoMoviePerformedShot.ISuccess;

  /** The same original resolved set. */
  clearStage: IAutoMovieStagedSet.ISuccess;
}
