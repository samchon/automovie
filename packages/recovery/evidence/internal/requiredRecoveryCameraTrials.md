# src/internal/requiredRecoveryCameraTrials.ts#requiredRecoveryCameraTrials

## @evidence contracts/development/implementation.md#principled-implementation

The exact finite-population success product over (inliers-j)/(population-j) accounts for distinct draws, and log1p computes ceil(log(1-confidence)/log(1-success)) without subtractive cancellation. An impossible or unrepresentably rare sample requires infinitely many trials.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar stopping calculation serves epipolar support and a separately specified forbidden homography overlap, keeping their populations explicit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The optimistic fraction-to-sample-power approximation is not used for small populations; impossible sampling is not capped to the caller's budget or labelled confident.

## @evidence contracts/development/common.md#meaningful-documentation

States unique within-trial samples, repeated across-trial subsets, ideal-model assumptions, Infinity meaning and separation from physical correctness.

## @evidence contracts/development/implementation.md#efficient-algorithms

A sample of s indices requires O(s) scalar work and constant storage; no combinations or factorials are enumerated.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pure arithmetic owns no proposal stream or cross-call cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar escapes and no borrowed collection, task or handle is retained.
