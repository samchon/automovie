# src/auditAutoMovieRenderObservation.ts#auditAutoMovieRenderObservation

## @evidence contracts/development/implementation.md#principled-implementation

Each observable metric is compared with its unique finite non-negative report bound; duplicate findings, absent bounds and unknown observed counts remain unchecked rather than certifying agreement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns the report-versus-capture comparison only, using one table to associate observation fields with report metrics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No metric is defaulted to zero and no duplicate finding wins by position; greater observed counts become breaches while smaller counts remain admissible after culling.

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains conservative bounds, culling and unchecked measurements; return fields distinguish complete agreement, breaches and unknown metrics.

## @evidence contracts/development/implementation.md#efficient-algorithms

For R findings, one map-building traversal plus seven fixed observation comparisons costs O(R) time and O(R) indexed entries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The per-call finding map supplies all observation lookups without repeatedly scanning the report; results cannot be reused for a different capture observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Maps and duplicate sets are call-local, and the returned breach and unchecked arrays contain at most seven entries with no report or graphics-context ownership.
