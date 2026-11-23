# src/perform/HumanSegmentSelection.ts#HumanSegmentSelection.last

## @evidence contracts/development/common.md#meaningful-documentation

States placement-order priority, dense input ownership, the film second and borrowed or absent result.

## @evidence contracts/development/implementation.md#principled-implementation

The first match from the array's end is exactly the last match of the prior forward scan, even when entry seconds are unsorted; the existing seconds plus 1e-12 comparison is unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Return for an empty array, compute the same comparison limit once and stop a reverse scan at its first match.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not sort, merge, clamp or sample entries; duplicate/equal entries retain last-placement priority and no selected evaluator is replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses O(R) comparisons for R inspected entries, at most S for S segments; a matching final segment needs one comparison. Auxiliary space is O(1), with no reversed array, callback, new runtime API or index cache.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Three readers share one selection rule and one scalar limit per query; no result persists across mutable placement or public query lifetimes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state and returns the existing borrowed segment reference.
