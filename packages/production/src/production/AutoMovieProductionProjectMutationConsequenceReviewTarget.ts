import { IAutoMovieReviewTarget } from "@automovie/interface";

/**
 * Review addresses emitted by project design mutation, excluding compiled subjects.
 *
 * @evidence contracts/common.md#principled-implementation Exclude removes the subject arm from the existing closed review union; compiled-subject evidence is owned by a separate review workflow.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the canonical review address shape rather than defining a second identifier schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime admission or replacement subject review is implied by this type.
 * @evidence contracts/common.md#meaningful-documentation Design, source, asset, shot, rendition, sequence and film arms retain their original address meaning.
 * @evidence contracts/performance.md#efficient-algorithms This erased union performs no runtime traversal; consequence producers own graph and sorting costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical arm shapes are reused without a runtime cache or object construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type owns no retained values, descriptors or tasks.
 * @author Samchon
 */
export type AutoMovieProductionProjectMutationConsequenceReviewTarget = Exclude<IAutoMovieReviewTarget, {
    kind: "subject";
}>;
