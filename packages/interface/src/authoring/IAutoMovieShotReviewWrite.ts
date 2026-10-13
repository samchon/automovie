import { IAutoMovieReviewNote } from "../harness/IAutoMovieReviewNote";

/**
 * Evidence-first human or agent decision about one performed shot.
 *
 * `reviewShot` normalizes it into the verdict the re-perform loop runs on.
 *
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
