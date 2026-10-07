import type { IAutoMoviePerformedShot } from "@automovie/engine";
import type { IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieVector3 } from "@automovie/interface";

/** The original launch scenario consumer, including its optional live target reader. */
export type FilmLaunchPerformer = (
  draft: IAutoMovieActionCall[],
  targetAt?: (target: IAutoMovieActionTarget, seconds: number) => IAutoMovieVector3 | null,
) => IAutoMoviePerformedShot;
