# src/perform/blendPoses.ts#blendPoses

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates weight and weight-times-value for each bone/axis, then divides only axes with positive accumulated weight; unset axes stay null instead of diluting another layer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bone-keyed accumulator owns weighted means and root authority, separate from timeline sampling and region masks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture-specific blending or hidden neutral-angle offset exists; callers supply valid finite weights/angles, and binary64 products/sums must remain representable.

## @evidence contracts/development/common.md#meaningful-documentation

States clinical weighted means, null-axis treatment, input premises, first-bone order, borrowed root and ROM refusal downstream.

## @evidence contracts/development/implementation.md#efficient-algorithms

For J supplied joint entries, B distinct bones and L layers, O(J+B+L) time and O(B) accumulator/output storage; every set axis must contribute once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each bone has one shared accumulator across layers; sampled poses and the selected root are read directly without another FK or motion bake.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Accumulators are invocation-local and the caller owns fresh joint output; the root remains borrowed and no pose cache, task or external resource persists.
