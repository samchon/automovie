# src/scene/inspection/compareAutoMovieInspectionFindings.ts#compareAutoMovieInspectionFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the three ordered keys, the rule for an absent rank, that rank compares only within one identity, and the sign of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the order `IAutoMovieInspectionDiagnostics.IEpisode.worst` documents: strongest confidence, then category, then rank, larger worse; an absent rank orders below any present one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three ordered comparisons, each returning as soon as it decides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ties return zero, so each caller keeps its own tie rule, the earlier observation for the reducer and the round diff.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reducer and the capture round diff share this one order instead of keeping copies.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.
