import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Sit on a seated partner's lap: a child or an adult stands before the
 * partner's knees, facing away, and sits down onto the partner's thighs, which
 * bear the sitter's seat while the partner's own seat still bears on the chair.
 * Getting off is the ordinary rise.
 */
export interface IAutoMovieMotionHumanSitOnLap {
  /** The seated partner whose lap is sat on. */
  partner: string;

  /**
   * Seconds to stay seated on the lap after settling; the sit's own when
   * absent.
   */
  hold?: number;

  /** How the sitter sits down. */
  manner?: IAutoMovieMotionManner;
}
