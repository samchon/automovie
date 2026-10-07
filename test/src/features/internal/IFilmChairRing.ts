import type {
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

/** Original chair registry and corresponding staged placements. */
export interface IFilmChairRing {
  /** Generated original prop specs in slot order. */
  specs: IAutoMoviePropSpec[];

  /** Corresponding original staged placements. */
  set: IAutoMovieStageSetPiece[];
}
