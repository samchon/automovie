# src/validation/validateAutoMovieFormationMotions.ts#validateAutoMovieFormationMotions

## @evidence contracts/development/implementation.md#principled-implementation

Check bounded formation cues against participating compiled formations, runtime gait repertoire, finite state, layout and nonoverlapping intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Request-local runtime/repertoire maps share model gait reads across cues and deterministic ordering groups each unit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 256-cue cap is a diagnostic, not truncation; unknown runtime models contribute no repertoire rather than an invented gait.

## @evidence contracts/development/common.md#meaningful-documentation

Paths identify cue fields; optional layout means no new reform target and supported easing names remain closed.

## @evidence contracts/development/implementation.md#efficient-algorithms

C sorting plus formation/model repertoire scans dominate; formation find remains O(CF), with O(F+M+C) local indexes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing gait owner supplies repertoire and maps live only for this shot's current inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only diagnostics escape; local sets/maps borrow compiled records without retaining a host bake or animation task.
