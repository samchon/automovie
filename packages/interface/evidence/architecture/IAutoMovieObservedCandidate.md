# src/architecture/IAutoMovieObservedCandidate.ts#IAutoMovieObservedCandidate

## @evidence contracts/development/design.md#principled-representation `validateDesignReference` checks semantic presence, resolving distinct primitive/alternative/issue references, non-self alternatives and confidence in [0, 1]. At most one observed analysis may claim the candidate, and a claimed candidate's primitive frames must match that analysis. No producer is allowed structurally but promotion then withholds it as unobserved; confidence and semantic meaning are authored claims, not independently calibrated or inferred.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The candidate carries its own blocking links, so promotion decides from one record without scanning other candidates or issues, and the semantic label stays an open string the building source interprets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Promotion withholds any candidate that lists a rival instead of choosing the more confident reading, and a candidate assembled from marks on another sheet is refused rather than given the claiming analysis's scale.

## @evidence contracts/development/common.md#meaningful-documentation

States that the record is a proposal, that only its own lists block it and neither link must be mutual, the uniqueness and resolution of each list, the confidence range, and the single-analysis, single-frame rule.
