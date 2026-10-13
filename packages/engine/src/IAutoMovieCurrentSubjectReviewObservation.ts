import {
  IAutoMovieSubjectReviewObservation,
  IAutoMovieSubjectReviewTarget,
} from "@automovie/interface";

import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the
 * exact persisted schema, pose, owned artifact bytes and terminal verdict.
 *
 * The engine does not trust the type: `foldAutoMovieSubjectReviewCoverage`
 * receives `unknown` records and counts one only after a structural guard finds
 * the `subject-view` kind, non-blank identities, `verdict: "passed"`,
 * `deliveryEvidence: false` and a target naming the same subject. `target` and
 * `verdict` restate members the base observation already declares with the
 * same types; the member the context adds is `captureRuntimeIdentity`.
 *
 * @author Samchon
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
