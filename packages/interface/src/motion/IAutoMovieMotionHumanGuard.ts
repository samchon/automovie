import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * The fighting stance taken and held: from whatever the performer stands in,
 * each foot steps to its stance place in turn (the rear foot first, so the lead
 * foot stays a support), the root sinks until both knees soften and turns to
 * the stance heading, and the gloves come up to the guard, then the stance
 * holds with a light bounce through the knees.
 *
 * The stance itself is `StrikingStance`: measured on the body, so any stature
 * takes its own. A foot already within 1 cm of its place stays planted. The
 * line faces the `facing` target when one is given (read at the start),
 * otherwise it keeps the entry's line: a performer already in a stance keeps
 * its line, and one standing square faces straight ahead.
 *
 * The bounce: kickboxers keep a rhythmic bounce between exchanges; its height
 * is a third of the stance's sink and its rate two bounces a second,
 * provisional readings of coaching footage (the kickboxing research's rhythm
 * share) with no located measurement.
 */
export namespace IAutoMovieMotionHumanGuard {
  /**
   * The sporting guard shape. Boxing carries the gloves close to the jaw.
   * Kickboxing uses the original open glove carriage.
   */
  export type Style = "boxing" | "kickboxing";

  /** Parameters. */
  export interface IParams {
    /**
     * How long the guard is held, seconds; 1 when absent and never under the
     * 0.6 s the stance takes to set (`guard.SET`).
     */
    duration?: number;

    /** Which side leads; the entry's leading side when absent. */
    stance?: "orthodox" | "southpaw";

    /**
     * Sport's glove carriage: `boxing` close to the jaw, `kickboxing` the more
     * open guard, both described on the stance
     * ({@link IAutoMovieMotionHumanStrikingStance}). The open guard when
     * absent.
     */
    style?: Style;

    /** What to face; the entry's line when absent. */
    facing?: IAutoMovieMotionTarget;
  }
}
