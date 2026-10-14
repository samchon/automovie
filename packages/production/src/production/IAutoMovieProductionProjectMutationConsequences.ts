import { IAutoMovieDesignMutationConsequences } from "@automovie/interface";
import { AutoMovieProductionProjectMutationConsequenceReviewTarget } from "./AutoMovieProductionProjectMutationConsequenceReviewTarget";

/**
 * Predicted design-mutation consequences with the producer's narrower review targets.
 *
 * @evidence contracts/common.md#principled-implementation Inherited render/generated lists keep their address shapes while staleReviews excludes compiled subjects; producing this record does not physically apply its lists.
 * @evidence contracts/common.md#clear-and-simple-design Omit replaces only the review member and leaves the canonical report fields shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused mutation can return the same predictions without state changes; accepted reporting alone is not proof of artifact deletion.
 * @evidence contracts/common.md#meaningful-documentation Lists report stale review/render addresses and generated paths, with persistence effects owned by the setter or erasure operation.
 * @evidence contracts/performance.md#efficient-algorithms The interface adds no runtime work; graph traversal, path copying and sorting belong to its producer.
 * @evidence contracts/performance.md#reuse-equivalent-work Field contracts are reused, while each operation owns its actual report population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns arrays and target records; no fixed population bound or resource release is supplied by a type.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectMutationConsequences extends Omit<IAutoMovieDesignMutationConsequences, "staleReviews"> {
    /** Predicted stale review addresses; this record does not perform their invalidation. */
    staleReviews: AutoMovieProductionProjectMutationConsequenceReviewTarget[];
}
