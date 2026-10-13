import { IAutoMovieVector3 } from "@automovie/interface";

/** One subject's deterministic measurements over a shot. */
export interface IAutoMovieGrammarSubjectObservation {
  /** Stable scene-node or formation id. */
  id: string;
  /** World root at the opening frame. */
  start: IAutoMovieVector3;
  /** World root at the closing frame. */
  end: IAutoMovieVector3;
  /** Positive world-space subject height in metres. */
  height: number;
  /**
   * Half the subject's horizontal diagonal in metres, or 0 when nothing
   * horizontal could be measured.
   *
   * The same number {@link IAutoMovieFramedBox.radius} states, and read here for
   * the same reason the framing solve reads it: a subject wider than the frame
   * can hold at its declared height is placed by its width, so a shot size
   * measured from the height alone reports a framing no camera delivered. A
   * figure is taller than it is wide at every shot size and its radius decides
   * nothing; a 60 m facade is the opposite.
   */
  radius: number;
  /** Resolved gaze target over the shot, or null when it is not observed. */
  eyeline: {
    /** Stable semantic target id, even when that target is outside the frame. */
    target: string;
    /** World gaze target at the opening frame. */
    start: IAutoMovieVector3;
    /** World gaze target at the closing frame. */
    end: IAutoMovieVector3;
  } | null;
}
