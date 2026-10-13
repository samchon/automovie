import { AutoMovieFilmTime } from "./AutoMovieFilmTime";
import { IAutoMovieFilmTransition } from "./IAutoMovieFilmTransition";

/**
 * One source-shot trim and placement on the finished-film video track, authored in the selected film-time form.
 *
 * @evidence contracts/common.md#principled-implementation The compiler converts source and global time boundaries and handles to exact production frames, preserving half-open trim lengths and admitted fade or cross-shot dissolve semantics.
 * @evidence contracts/common.md#clear-and-simple-design Source trim, global start and explicit handle/transition records express edit intent independently from the source shot's story-time pin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Referenced shots and usable source extents must exist; transitions cannot invent footage or a playback rate, and edit position is not used as story chronology.
 * @evidence contracts/common.md#meaningful-documentation Defines inclusive/exclusive boundaries, source versus film-global placement, available handle material and the two side transitions.
 * @author Samchon
 */
export interface IAutoMovieVideoEdit {
  /** Current compiled shot id. */
  shot: string;

  /** Inclusive source boundary, converted to the production frame grid. */
  sourceIn: AutoMovieFilmTime;

  /** Exclusive source boundary, converted to the production frame grid. */
  sourceOut: AutoMovieFilmTime;

  /** Film-global inclusive start boundary, converted to the production frame grid. */
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
