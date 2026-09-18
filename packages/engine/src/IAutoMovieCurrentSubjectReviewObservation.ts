import { IAutoMovieSubjectReviewObservation, IAutoMovieSubjectReviewTarget } from "@automovie/interface";
import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the
 * exact persisted schema, pose, owned artifact bytes and terminal verdict.
 */
export interface IAutoMovieCurrentSubjectReviewObservation
  extends
    IAutoMovieSubjectReviewObservation,
    IAutoMovieSubjectReviewCurrentContext {
  /** Exact target repeated on the receipt for an independent context join. */
  target: IAutoMovieSubjectReviewTarget;
  /** Only a terminal pass can enter the coverage numerator. */
  verdict: "passed";
}
