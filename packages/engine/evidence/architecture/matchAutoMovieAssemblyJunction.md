# src/architecture/matchAutoMovieAssemblyJunction.ts#matchAutoMovieAssemblyJunction

## @evidence contracts/development/implementation.md#principled-implementation

Each side's layers are folded into one interval hull and summed thickness per exact role name, and two hulls' signed overlap is `min(max) - max(min)`, which is negative exactly when the intervals are apart; alignment compares that gap with the tolerance. The shared-line premise is the caller's and the documentation says it is not checked.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold per side into a role map and one pass over each map, with the junction verdict computed from those spans alone.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no role and gives no role special meaning; an invalid tolerance is refused rather than defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States what continuity and alignment mean, how repeated roles fold, the unchecked shared-line premise and why it cannot be checked, the sign of `overlap`, the output orders, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the two sides' layer counts, with one map lookup per layer and per role.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison of two resolved values that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the two role maps only for the call; the caller owns the returned junction.
