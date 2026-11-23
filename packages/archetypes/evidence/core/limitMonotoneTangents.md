# src/core/limitMonotoneTangents.ts#limitMonotoneTangents

## @evidence contracts/development/common.md#meaningful-documentation

States the condition, its source and why it is needed.

## @evidence contracts/development/implementation.md#principled-implementation

Fritsch and Carlson's sufficient monotonicity region (their two-line region, which keeps the leading term out of a hold along the chord), taken along each interval's chord.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the scales, one to apply them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tangents are only shortened, never turned; a course whose cubics already satisfy the condition is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) for N samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure helper.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
