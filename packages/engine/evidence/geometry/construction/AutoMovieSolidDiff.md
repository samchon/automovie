# src/geometry/construction/AutoMovieSolidDiff.ts#AutoMovieSolidDiff.create

## @evidence contracts/development/implementation.md#principled-implementation

Selects the shared join's inside kept side for the cutter, leaving contact tracing, rails and boundary ribbons with their existing geometry owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direct call expresses the diff-specific choice without a second intersection or blend implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Forwards the input and the join's nullable-result/diagnostics unchanged, with no material-side compensation, retry or replacement surface.

## @evidence contracts/development/common.md#meaningful-documentation

Names cutter/host roles, inside keep and the actual result record's failure meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant wrapper work to one complete shared join operation; its trace/rail/fold-check costs are not removed by this delegation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same join implementation as merge and forwards any supplied trace for the join owner to reuse; no result cache is added here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller receives the join result and its transitive records/caches; this wrapper retains no input or resource after returning.
