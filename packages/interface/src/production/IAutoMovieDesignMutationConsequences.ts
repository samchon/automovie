import { IAutoMovieReviewTarget } from "./IAutoMovieReviewTarget";

/** Consequences computed before one design mutation is committed. */
export interface IAutoMovieDesignMutationConsequences {
  /** Review targets that become stale. */
  staleReviews: IAutoMovieReviewTarget[];

  /** Render bundle ids that become stale. */
  staleRenders: string[];

  /** Generated paths invalidated by the mutation. */
  removedGenerated: string[];
}
