import { IAutoMovieReviewNote } from "../harness/IAutoMovieReviewNote";

/**
 * Evidence-first human or agent decision about one performed shot.
 *
 * `reviewShot` normalizes it into the verdict the re-perform loop runs on.
 *
 * @evidence contracts/common.md#principled-implementation `reviewShot` refuses a `revise` with no notes, a `pass` with notes, a beat outside the script, and a note filed on another beat, so the verdict and the open-note backlog cannot contradict each other.
 * @evidence contracts/common.md#clear-and-simple-design Four fields: beat, prose observations, a two-value verdict and notes; the verdict deliberately repeats what note emptiness implies so the gate can catch a contradiction instead of inferring intent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `observations` is never checked, so an empty string passes although the type calls the review evidence-first; no beat or tier receives special handling.
 * @evidence contracts/common.md#meaningful-documentation States the pass and revise note rules, that every note must name this beat, and that observations are unchecked prose.
 * @author Samchon
 */
export interface IAutoMovieShotReviewWrite {
  /** Reviewed script beat; it must name a beat of the script. */
  beat: string;

  /** Concrete observations from current render evidence; not checked. */
  observations: string;

  /** Pass only when no correction note remains open. */
  verdict: "pass" | "revise";

  /**
   * Located corrections, each filed on {@link beat}; non-empty exactly when
   * verdict is revise.
   */
  notes: IAutoMovieReviewNote[];
}
