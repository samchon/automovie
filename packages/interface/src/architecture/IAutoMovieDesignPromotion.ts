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
