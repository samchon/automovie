import { IAutoMovieConstraintViolation, IAutoMovieReviewNote } from "@automovie/interface";

export type IAutoMovieShotReview =
  | IAutoMovieShotReview.ISuccess
  | IAutoMovieShotReview.IFailure;
export namespace IAutoMovieShotReview {
  /**
   * The review is coherent; act on its verdict.
   *
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     */
    success: true;

    /**
     * Which beat was judged.
     *
     */
    beat: string;

    /**
     * The verdict, verbatim.
     *
     */
    verdict: "pass" | "revise";

    /**
     * The correction backlog for a revise (empty on a pass), what the next
     * blocking/performance round must read via `getNotes` and fix.
     *
     */
    notes: IAutoMovieReviewNote[];
  }

  /**
   * The review contradicted itself or the script.
   *
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     */
    success: false;

    /**
     * Every contradiction found, for the correction round.
     *
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
