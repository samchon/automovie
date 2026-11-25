import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * What `cutSequence` returns for one edit plan: the {@link IAutoMovieSequence}
 * the ASSEMBLE stage edited, or every contradiction that stopped it.
 */
export type IAutoMovieCut = IAutoMovieCut.ISuccess | IAutoMovieCut.IFailure;

/** Data and callback contracts shared by the Cut operations. */
export namespace IAutoMovieCut {
  /**
   * Every gate held: each entry names a built shot, each trim is a positive
   * span inside its shot, each transition fits inside both neighbours' played
   * spans without overlapping the previous entry's own incoming transition, ids
   * are non-blank, and the frame rate is finite and positive. Each edit event
   * requirement matches exactly one event in its addressed playback entry.
   * Every declared prop channel matches within tolerance across its hard cut.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The edited cut-list in plan order, ready for the renderer. */
    sequence: IAutoMovieSequence;

    /**
     * Output running time in seconds: each entry's trim duration, or its whole
     * shot duration when untrimmed, summed, minus every transition duration,
     * because a transition overlaps the previous entry's tail.
     */
    runtime: number;
  }

  /** At least one gate failed; no sequence was emitted. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /**
     * Every violation found, each with a path into the edit plan
     * (`$input.entries[i]...`, `$input.requiredEvents[i]...` or
     * `$input.requiredPropContinuity[i]...`) or the shot list
     * (`$shots[i]...`).
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
