import { AutoMovieFilmTime } from "./AutoMovieFilmTime";
import { IAutoMovieFilmTransition } from "./IAutoMovieFilmTransition";

/** One source-shot placement on the finished-film video track. */
export interface IAutoMovieVideoEdit {
  /** Current compiled shot id. */
  shot: string;

  /** Inclusive source frame. */
  sourceIn: AutoMovieFilmTime;

  /** Exclusive source frame. */
  sourceOut: AutoMovieFilmTime;

  /** Film-global inclusive start frame. */
  start: AutoMovieFilmTime;

  /** Available transition material at each side of this placement. */
  handles: {
    /** Available incoming frames. */
    head: AutoMovieFilmTime;

    /** Available outgoing frames. */
    tail: AutoMovieFilmTime;
  };

  /** Transition entering this placement. */
  transitionIn: IAutoMovieFilmTransition;

  /** Transition leaving this placement. */
  transitionOut: IAutoMovieFilmTransition;
}
