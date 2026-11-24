# src/render/exposure/checkAutoMovieExposureContinuity.ts#checkAutoMovieExposureContinuity

## @evidence contracts/development/implementation.md#principled-implementation

One pass in playing order keeps the last cut of each group and compares the next cut of that group with it, so cross-cutting compares each location with itself. A decided change is not reported and still becomes the reference. The default third of a stop is the issue's tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single function: admission and comparison happen in the same pass because both read each cut once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No group or value is special-cased; duplicates and non-finite values throw rather than being skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States the ordering premise, the per-group comparison, the change rule, the default and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) time and O(N + G) space for N cuts in G groups, with hashed index and group lookups.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One check per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The index set and group map live for the call and are dropped on return or throw.
