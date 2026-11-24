/**
 * The explicit context of one evaluation of an action plan's posture and of the
 * primitives it composes, beyond the second, the channels, the resolution and
 * the projection: what a caller lends that one evaluation and nothing after
 * it.
 *
 * A plan or primitive that reads another plan or primitive at the same
 * evaluation passes it on unchanged, as it passes the resolution and the
 * projection. Absent, the evaluation borrows nothing.
 */
export interface IAutoMovieMotionHumanEvaluation {
  /**
   * A numerical trial's loan of the arm bends it has already completed, which
   * the arm writers of this evaluation may reuse instead of solving again.
   * Absent, every bend is solved anew; either way the posture is the same.
   */
  bend?: IAutoMovieMotionHumanEvaluation.IBendLoan;

  /**
   * What a plan lends its own writers for this one evaluation: a value solved
   * once at the evaluation's second that every writer of the plan reads there.
   * A plan that lends passes on the rest of the evaluation with its loan in
   * this place; a writer reads only a loan its own plan made.
   */
  loan?: IAutoMovieMotionHumanEvaluation.ILoan;
}
export namespace IAutoMovieMotionHumanEvaluation {
  /**
   * A plan's loan to its own writers: identified by the plan that made it, its
   * contents known only to that plan's writers.
   */
  export interface ILoan {
    /** The plan the loan was made by. */
    readonly owner: object;
  }

  /**
   * A bend loan: made by the trial for one plan, and read only by the motions
   * package's bend owner, which recognizes its own loans.
   */
  export interface IBendLoan {
    /** The plan the loan was made for. */
    readonly owner: object;
  }
}
