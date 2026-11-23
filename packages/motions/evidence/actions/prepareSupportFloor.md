# src/actions/prepareSupportFloor.ts#prepareSupportFloor

## @evidence contracts/development/common.md#meaningful-documentation

States entry ownership, target units and the support history returned.

## @evidence contracts/development/implementation.md#principled-implementation

Keep the entry datum if the same part already bears on the same surface. Otherwise read the first solved stance where it bears.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Entry selection uses one batched achieved-point read after matching bearings; each key registers only new unnamed floor placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both faces of a lying body share a window identifier, so the actual trunk orientation distinguishes them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bone demand per key with unobserved contacts; no repeated remeasurement of a held contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One solved key supplies all its new ground positions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One sequence-local map owns achieved floor positions until plan release. No sampled posture or FK reader is retained.
