import type { IAutoMovieRecoveryOpenArcAddress } from "..";

/** Prepared directional link between two saved adjacent open curves. */
export type IAutoMovieRecoveryOpenContinuationEdge = {
  /** Saved open curve at the earlier endpoint. */
  before: IAutoMovieRecoveryOpenArcAddress;

  /** Saved open curve at the later endpoint. */
  after: IAutoMovieRecoveryOpenArcAddress;

  /** Whether the later curve must reverse its saved direction for this link. */
  reverse: boolean;

  /** Source pair position within its saved interval. */
  pairOrdinal: number;
};
