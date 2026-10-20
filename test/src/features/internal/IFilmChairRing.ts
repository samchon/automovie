import type {
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

/**
 * Original chair registry and corresponding staged placements, owned by the caller and mutable within its isolated case.
 */
export interface IFilmChairRing {
  /** Generated original prop specs in slot order. */
  specs: IAutoMoviePropSpec[];

  /** Corresponding original staged placements. */
  set: IAutoMovieStageSetPiece[];
}
