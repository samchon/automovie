import { compareCodeUnits } from "./contentIdentity";
import { AutoMovieProductionProjectMutationConsequenceReviewTarget } from "./AutoMovieProductionProjectMutationConsequenceReviewTarget";
import { IAutoMovieProductionProjectMutationConsequences } from "./IAutoMovieProductionProjectMutationConsequences";
import { productionProjectReviewConsequenceKey } from "./productionProjectReviewConsequenceKey";

/**
 * Merge before/after predictions and optionally omit rendition reviews.
 *
 * @evidence contracts/common.md#principled-implementation Canonical review keys deduplicate with the next record winning; string sets deduplicate render/generated addresses and code-unit sorts stabilize output.
 * @evidence contracts/common.md#clear-and-simple-design One report fold leaves physical mutation and currentness validation with the operation owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rendition filtering applies to both reports, without silently filtering other review classes.
 * @evidence contracts/common.md#meaningful-documentation Inputs remain unchanged and target objects are borrowed; merged reporting does not apply invalidations.
 * @evidence contracts/performance.md#efficient-algorithms Copies both populations, performs keyed/set folds and sorts their unique outputs, including repeated review-key and string-comparison cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate addresses share one output within the call; no cross-operation cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary concatenations, maps and sets release; the caller owns sorted arrays and borrows target objects, without a fixed size cap.
 */
export function productionProjectMergeMutationConsequences(current: IAutoMovieProductionProjectMutationConsequences, next: IAutoMovieProductionProjectMutationConsequences, includeRenditions: boolean): IAutoMovieProductionProjectMutationConsequences {
    const staleReviews: Map<string, AutoMovieProductionProjectMutationConsequenceReviewTarget> = new Map<string, AutoMovieProductionProjectMutationConsequenceReviewTarget>();
    for (const target of [...current.staleReviews, ...next.staleReviews])
        if (target.kind !== "rendition" || includeRenditions)
            staleReviews.set(productionProjectReviewConsequenceKey(target), target);
    return {
        staleReviews: [...staleReviews.values()].sort((left: AutoMovieProductionProjectMutationConsequenceReviewTarget, right: AutoMovieProductionProjectMutationConsequenceReviewTarget): number => compareCodeUnits(productionProjectReviewConsequenceKey(left), productionProjectReviewConsequenceKey(right))),
        staleRenders: [
            ...new Set([...current.staleRenders, ...next.staleRenders]),
        ].sort(compareCodeUnits),
        removedGenerated: [
            ...new Set([...current.removedGenerated, ...next.removedGenerated]),
        ].sort(compareCodeUnits),
    };
}
