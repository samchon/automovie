# src/mergeAutoMovieSubjectContributions.ts#mergeAutoMovieSubjectContributions

## @evidence contracts/development/implementation.md#principled-implementation

Concatenates each declared contribution field in subject order, preserving duplicate entries for the builder's admission checks. A complete keyof record makes additions to the contribution schema require a merge key, and the local indexed push cast represents that same-key element invariant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field-complete loop replaces per-field concatenations while retaining the contribution record consumed by subject groups and source construction; it adds no deduplication policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject identity is treated specially; duplicate claims survive to their owning validator and no empty field is populated with invented content.

## @evidence contracts/development/common.md#meaningful-documentation

States order, duplicate preservation, fresh-array and borrowed-entry ownership, omitted empty fields and post-merge validation duty.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits the fixed field set once per contribution and appends each present entry once, O(C*F+N) time and O(N) output references for C contributions, F schema fields and N entries; no intermediate flattened copies are built.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This merge consumes one ordered list and does not coordinate requests; borrowing entry references preserves identity without caching a mutable contribution's result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned field arrays retain input entries, bounded by their total count; the caller owns those arrays and this function retains no state or handle.
