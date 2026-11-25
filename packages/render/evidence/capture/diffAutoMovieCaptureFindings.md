# src/capture/diffAutoMovieCaptureFindings.ts#diffAutoMovieCaptureFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the identity, severity order, coverage needed for each comparison state, retained witnesses and uncovered intervals, error outcome, and omitted case.

## @evidence contracts/development/implementation.md#principled-implementation

The five-field identity pairs findings within the same continuity occurrence. For a range, the reducer's consecutive sample count and output index identify the required frames, and recorded clocks must share the grid at frame index divided by frame rate and a proven source shot clock. An isolated sample can match directly at the same film second and shot clock across grid rates. A finding in one round needs checked coverage from the other. A shared finding needs it from both rounds for both sets of episodes. With that coverage, `compareAutoMovieInspectionFindings` orders the worst witnesses. Uncovered intervals use film seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Summarize each round by identity, index coverage by obligation, classify each identity, and decide the outcome from the errors. Both classifications use the same sampled coverage test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmatched finding keeps its available witnesses, first missing coverage cause, and every uncovered interval. A legacy multi-sample episode or a conflicting exact witness cannot prove an interior shot clock. A legacy coverage range can establish an exact recorded endpoint and needs clock proof to establish an unrecorded interior sample. Projected gap bounds allow only rounding from frame-time arithmetic. An unmatched error prevents an improvement verdict. A record without diagnostics omits the diff.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each audit's episodes are summarized once, storing their references and strongest observations by identity. Its coverage is indexed once for relevant obligations in recorded order. Comparison time is driven by each episode's relevant coverage ranges, and the index traversal records gaps without enumerating frames. The returned entries retain only their witnesses and uncovered intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The in-call coverage index serves all findings that share the same audit, scope, check and key. Each invocation builds the index from its supplied snapshots.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain values and keeps nothing.
