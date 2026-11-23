# src/resolve/applyChannelLimit.ts#applyChannelLimit

## @evidence contracts/development/implementation.md#principled-implementation

Validate finite values/bounds and ordered min/max, then project each component into its interval while recording the original crossing; null bounds preserve that direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One component walk produces both usable values and correction causes, with channelKey sharing address identity with the resolver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Component clamping does not normalize quaternions or impose anatomical coupling; sparse/nonfinite bounds are refused rather than repaired with fixture values.

## @evidence contracts/development/common.md#meaningful-documentation

Docs explain nullable directions, output ownership, crossed-bound diagnostics and the component-space scope of this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

W values and bound lengths require O(W+L) validation/projection, O(W) copied values and at most W admitted ordered-bound crossings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The resolver consumes the clamped values and violations together; altered values/limits require fresh comparisons and no mutable-result cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh output/diagnostic arrays; borrowed input values/limits survive success or refusal unchanged, and no handle or task is acquired.
