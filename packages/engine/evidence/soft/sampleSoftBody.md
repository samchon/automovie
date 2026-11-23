# src/soft/sampleSoftBody.ts#sampleSoftBody

## @evidence contracts/development/implementation.md#principled-implementation

The canonical time-to-step rule feeds the static absolute replay, including its budget refusal and named-state semantics; valid positive clock spacing is a domain-admission premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Time quantization stays separate from integration so lowering can inspect a requested step before choosing an analysis status.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonfinite second is refused, not clamped into a plausible frame; no incremental playback cursor changes a repeated seek.

## @evidence contracts/development/common.md#meaningful-documentation

States quantization, negative-time behavior, failures and unwired runtime reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quantization is constant work, followed by the static solver's O(P*K*(I+C)) replay and O(P) state storage at requested step K.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The quantizer and replay owners are shared; same-step requests still replay because no equivalence-safe persistent trajectory cache exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fresh solver result transfers to the caller; this sampler retains no domain, prior frame or animation task.
