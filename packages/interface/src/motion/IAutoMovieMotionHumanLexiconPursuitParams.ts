import type { IAutoMovieMotionHumanApproach } from "./IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanPursuit } from "./IAutoMovieMotionHumanPursuit";

/**
 * Open parameters of the pursuit lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconPursuitParams {
  /**
   * Come up behind a person at the social distance, as a follower closes the
   * gap.
   */
  follow: Omit<IAutoMovieMotionHumanApproach.IParams, "from" | "at" | "track">;

  /**
   * Come to a person's left side at the personal distance, as an escort takes
   * station.
   */
  escort: Omit<IAutoMovieMotionHumanApproach.IParams, "from" | "at" | "track">;

  /**
   * Run after a person to arm's length of where they will be, as a chase ends:
   * a row of `intercept`, so a chase runs.
   */
  chase: IAutoMovieMotionHumanPursuit.IIntercept;

  /** Step up face to face, as a confrontation begins. */
  confront: Omit<IAutoMovieMotionHumanApproach.IParams, "from" | "at">;

  /**
   * Head a moving person off: a run to where they will be when the runner gets
   * there, stopping at arm's length of that place (the handing gap of
   * `HumanProxemics`), not to where they are when it begins.
   *
   * The meeting instant is the one at which the run to the person's place at
   * that instant ends at that instant, found by planning the run to where they
   * are at each estimate and taking its end as the next, up to eight times, to
   * within one 24th of a second. Their place is read from their placed actions,
   * so they are composed before the runner. A person the pace does not close on
   * is refused with the last estimate. First pass: one straight run, so the
   * bearing to the person is held only as far as both go straight (Fajen and
   * Warren 2007 describe the curved approach of real interceptions).
   */
  intercept: IAutoMovieMotionHumanPursuit.IIntercept;

  /**
   * Run straight away from a person: a run to the point `metres` from where the
   * performer stands, on the line from the person through the performer.
   * Glances back are a look performed over it.
   */
  flee: IAutoMovieMotionHumanPursuit.IFlee;
}
