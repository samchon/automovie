import { IAutoMovieFilmBuildContext } from "./IAutoMovieFilmBuildContext";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/** Coding-agent-owned deterministic film module export. */
export interface IAutoMovieFilmSource {
  /** Build one finished-film edit from frozen builder context. */
  build(context: IAutoMovieFilmBuildContext): IAutoMovieFilmEdit;
}
