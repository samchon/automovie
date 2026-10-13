import { IAutoMovieReviewNote } from "../harness/IAutoMovieReviewNote";

/**
 * Evidence-first human or agent decision about one performed shot.
 *
 * `reviewShot` normalizes it into the verdict the re-perform loop runs on. The
 * notes are the open correction backlog, so a pass declares it empty and a
 * revise must leave the next round something to fix.
 *
 * @evidence contracts/common.md#principled-implementation `reviewShot` refuses a blank beat or one absent from the script, a `revise` with no notes, a `pass` with notes, and any note whose non-blank beat differs from this review's beat, so the verdict and the backlog cannot contradict each other.
 * @evidence contracts/common.md#clear-and-simple-design The write carries the beat, the free observations, the two-value verdict and the located notes; the normalized review keeps beat, verdict and notes, so observations stay review prose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observations are declared unchecked rather than scored, and a misfiled note is refused instead of being moved to the beat it names.
 * @evidence contracts/common.md#meaningful-documentation States which beat the review must name, that observations are never read, the exact verdict-to-notes rule, and the beat every note must carry.
 * @author Samchon
 */
export interface IAutoMovieShotReviewWrite {
  /** Non-blank reviewed script beat; it must name a beat of the script. */
  beat: string;

  /** Concrete observations from current render evidence; never checked. */
  observations: string;

  /**
   * `pass` only when no correction note remains open, `revise` when at least
   * one does.
   */
  verdict: "pass" | "revise";

  /**
   * Located corrections, each filed on {@link beat}; non-empty exactly when
   * `verdict` is `revise`.
   */
  notes: IAutoMovieReviewNote[];
}
