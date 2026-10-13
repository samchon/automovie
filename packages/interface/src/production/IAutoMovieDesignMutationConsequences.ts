import { IAutoMovieReviewTarget } from "./IAutoMovieReviewTarget";

/**
 * Downstream review, render and generated-path consequences predicted for a design mutation. Both accepted and refused results carry reports; the lists do not prove that reviews were marked stale or output bytes removed.
 *
 * @evidence contracts/common.md#principled-implementation Current design dependencies predict affected review/render addresses and supplied generated paths; accepted setters merge before/after predictions while committing the design separately.
 * @evidence contracts/common.md#clear-and-simple-design Three output lists separate review, rendered-byte and generated-source effects, reused by setters and erasure without embedding persistence operations in the record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Producing a report applies no physical invalidation; accepted design publication does not establish that every listed review/render/generated effect was applied.
 * @evidence contracts/common.md#meaningful-documentation The lists identify predicted review targets, render identities and supplied generated paths without claiming receipt-backed or physically applied removal.
 * @author Samchon
 */
export interface IAutoMovieDesignMutationConsequences {
  /** Review targets predicted to require renewed review. */
  staleReviews: IAutoMovieReviewTarget[];

  /** Render bundle ids predicted to require renewed output. */
  staleRenders: string[];

  /** Generated paths reported as affected; reporting does not delete them. */
  removedGenerated: string[];
}
