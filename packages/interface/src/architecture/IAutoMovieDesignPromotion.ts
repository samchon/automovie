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
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` validates the reference, then tests each candidate in a fixed order (unobserved, competing alternative, open issue, confidence below the floor, non-geometric primitive, unsettled scale) and files it under the first failure or as promoted; every non-observed analysis is copied to `skipped`.
 * @evidence contracts/common.md#clear-and-simple-design Three lists and no fourth state, in source declaration order; recording only the first failing reason keeps one row per candidate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The confidence floor defaults to 1 and is the caller's only parameter; an invalid reference or a floor outside `[0, 1]` throws rather than yielding a partial result.
 * @evidence contracts/common.md#meaningful-documentation States the partition of candidates, what each list holds, its ordering, and that a withheld row names only the first blocking reason.
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
