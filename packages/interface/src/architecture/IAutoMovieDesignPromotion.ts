import { IAutoMovieDesignPromotedReading } from "./IAutoMovieDesignPromotedReading";
import { IAutoMovieDesignSkippedAnalysis } from "./IAutoMovieDesignSkippedAnalysis";
import { IAutoMovieDesignWithholding } from "./IAutoMovieDesignWithholding";

/**
 * The complete, deterministic outcome of asking a reference for metric
 * geometry.
 *
 * Every candidate lands in exactly one of {@link promoted} or {@link withheld},
 * and every analysis that produced nothing is named in {@link skipped}. There is
 * no fourth pile, so a caller cannot mistake silence for agreement.
 *
 * Candidates keep their declaration order across both piles, and analyses
 * theirs in `skipped`. A withheld candidate carries only the first reason that
 * stopped it.
 *
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` validates the reference, walks analyses once to fill `skipped` and record which candidate an observed analysis produced, then walks candidates once and pushes each to `promoted` or `withheld` at the first failing gate.
 * @evidence contracts/common.md#clear-and-simple-design Three lists partition the answer by outcome, each with its own element type, so a caller reads promoted geometry without filtering out refusals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every admitted candidate is classified and every non-observed analysis is listed. The default confidence floor of one compares authored confidence values, not calibrated certainty or actual observation quality; caller-supplied finite floors in [0, 1] change only that gate. Promoted source points can still produce nonfinite world arithmetic, which no final finite-outline gate currently rejects.
 * @evidence contracts/common.md#meaningful-documentation States the exhaustive partition of candidates, that empty analyses are listed, the order each list keeps, and that only the first blocking reason is recorded.
 * @author Samchon
 */
export interface IAutoMovieDesignPromotion {
  /** Readings settled enough to become metric geometry. */
  promoted: IAutoMovieDesignPromotedReading[];

  /** Readings left as observation, each with its blocking reason. */
  withheld: IAutoMovieDesignWithholding[];

  /** Analyses that were unsupported or never run. */
  skipped: IAutoMovieDesignSkippedAnalysis[];
}
