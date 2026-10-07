import type {
  IAutoMovieBuiltEnvironment,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

/** The original isolated registry mutation used by placement admission assertions. */
export type FilmPropPlacementMutation = (
  props: IAutoMoviePropSpec[],
  set: IAutoMovieStageSetPiece[],
  environments: IAutoMovieBuiltEnvironment[],
) => void;
