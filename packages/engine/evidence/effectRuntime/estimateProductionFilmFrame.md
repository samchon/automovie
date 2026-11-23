# src/effectRuntime/estimateProductionFilmFrame.ts#estimateProductionFilmFrame

## @evidence contracts/development/implementation.md#principled-implementation

Uses the floating product only as a starting guess whose error is a few ulps, which the callers' boundary walks absorb by comparing `productionFrameBoundaryToSeconds` values; `Math.max(0, NaN)` stays NaN and `Infinity` exceeds the limit, so both fail the range test and return `null`. Beyond about `2^53 / denominator` frames the boundary arithmetic itself rounds, a limitation shared identically by the sampler, so the projection and sampler still agree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper owns the estimate and its safe-integer headroom for both frame searches, which differ only in rounding direction, so the rounding function is the parameter rather than two copies of the formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The estimate is never returned as the answer, and an unrepresentable time is reported as `null` for the caller to refuse rather than clamped to the largest frame.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the clamp at zero, that callers must settle the result by exact comparison, the two-frame headroom, and how non-finite products are reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one multiply, one divide, one rounding call and one comparison, which lets the callers' boundary walks finish in a few steps instead of scanning frames from zero.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar computation per call; there is no completed or in-flight work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing and holds no reference to `frameRate` after returning.
