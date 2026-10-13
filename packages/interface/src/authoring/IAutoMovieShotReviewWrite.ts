import { IAutoMovieReviewNote } from "../harness/IAutoMovieReviewNote";

/** Evidence-first human or agent decision about one performed shot. */
export interface IAutoMovieShotReviewWrite {
  /** Reviewed script beat. */
  beat: string;

  /** Concrete observations from current render evidence. */
  observations: string;

  /** Pass only when no correction note remains open. */
  verdict: "pass" | "revise";

  /** Located corrections; non-empty exactly when verdict is revise. */
  notes: IAutoMovieReviewNote[];
}
