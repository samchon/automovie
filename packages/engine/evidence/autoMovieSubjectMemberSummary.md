# src/autoMovieSubjectMemberSummary.ts#autoMovieSubjectMemberSummary

## @evidence contracts/development/implementation.md#principled-implementation

Sorting with the shared render-id comparator gives one deterministic order to page through, and clamping makes every offset a valid page without inventing ids.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One paging rule for subject member lists and diff consequence lists, which previously kept separate copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No id or list is special-cased; the sample limit is the shared named constant.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the order, the page size, the clamp, what `omitted` counts, and that the input is not mutated.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n log n) for n ids, dominated by the sort that defines which ids a page holds.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure summary of one list that coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sorted copy is released on return; the returned page holds at most the sample limit of ids.
