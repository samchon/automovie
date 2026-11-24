# src/capture/diffAutoMovieCaptureFindings.ts#diffAutoMovieCaptureFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the identity, the severity order and its owner, how intervals are read, when coverage counts as checked over an interval, every state, the outcome rule and the omitted case.

## @evidence contracts/development/implementation.md#principled-implementation

An episode keeps the first and worst observations and the last sample clock, so its span supplies the interval the comparison needs. The five-field identity pairs findings within the same continuity occurrence. A missing finding counts as fixed or new once the other round checked all its intervals. A shared identity needs checked coverage of both rounds' intervals in each audit. Coverage ranges merge across consecutive output frames and preserve gaps. When coverage suffices, compareAutoMovieInspectionFindings applies the reducer's severity order to the two worst witnesses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Summarize each round by identity, index the coverage of the involved obligations, classify this round's identities and then the earlier-only ones, and read the outcome from the errors. Both classifications share the interval coverage test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing or shared finding with insufficient coverage is unmatched with its cause and retains the witnesses available in both audits. An unmatched error keeps the round from being better. A record without diagnostics omits the diff.

## @evidence contracts/development/implementation.md#efficient-algorithms

Summarizing scans the episodes once per round. When there are findings, each audit's coverage is scanned once into an index for the relevant obligations, coalescing ranges in the audit's recorded order. Each interval test scans only the spans for its obligation and stops on the first uncovered interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The in-call span index serves all findings that share the same audit, scope, check and key. Each invocation builds the index from its supplied snapshots.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain values and keeps nothing.
