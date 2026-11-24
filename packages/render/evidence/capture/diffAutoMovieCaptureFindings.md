# src/capture/diffAutoMovieCaptureFindings.ts#diffAutoMovieCaptureFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the identity, the severity order and its owner, what proves checked samples on the capture clock, every state, the outcome rule and the omitted case.

## @evidence contracts/development/implementation.md#principled-implementation

The five-field identity pairs findings within the same continuity occurrence. The reducer's consecutive sample count and last output index bound an episode's sampled frames. The comparison uses the capture planner's regular clock at frame index divided by frame rate: known frame indices and elapsed clocks must represent the same grid, and all required indices must be checked. A singleton at a recorded matching film second and shot clock can match exactly across grid rates. An exact witness time remains a separate bound when it differs from the enclosing sample. A missing finding needs this proof from the other round, and a shared finding needs it from both rounds over both sets of episodes. With that proof, compareAutoMovieInspectionFindings applies the reducer's severity order to the worst witnesses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Summarize each round by identity, index the coverage of the involved obligations, classify this round's identities and then the earlier-only ones, and read the outcome from the errors. Both classifications share the sampled coverage test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing or shared finding with insufficient coverage is unmatched with its cause and retains the available witnesses. Matching elapsed range bounds cannot establish the same sampled frames. A source shot clock is checked when it is recorded at the comparison sample and is not reconstructed inside the range. An unmatched error prevents an improvement verdict. A record without diagnostics omits the diff.

## @evidence contracts/development/implementation.md#efficient-algorithms

Summarizing scans the episodes once per round. When there are findings, each audit's ranges are indexed once for the relevant obligations in recorded order, preserving their original endpoint clocks. Each episode scans only those ranges and advances over checked indices without enumerating frames.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The in-call span index serves all findings that share the same audit, scope, check and key. Each invocation builds the index from its supplied snapshots.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain values and keeps nothing.
