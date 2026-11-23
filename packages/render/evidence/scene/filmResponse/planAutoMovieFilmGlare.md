# src/scene/filmResponse/planAutoMovieFilmGlare.ts#planAutoMovieFilmGlare

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment states the level rule, the variance the pyramid adds and how it is subtracted, the tap extent and normalization, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each glare kernel is blurred at the pyramid level that leaves it at least two and under four level pixels of deviation. A box of width 2^l adds variance (4^l - 1) / 12 and the bilinear read back a tent of variance 4^l / 6, both subtracted so the composite keeps the contract's deviation to second moment; taps are the sampled Gaussian to three deviations, normalized so each kernel keeps its energy exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure plan the stage allocates targets from and drives its passes with, so the sampling decision is testable apart from the GPU.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The kernel deviations and weights come from the engine constant; the level rule and variance compensation are derived, not tuned. Odd level sizes misalign the deepest level by under one level pixel, which the stage's documentation leaves as a known limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per kernel. The plan bounds GPU cost to at most 12 taps a side per level pixel whatever the raster, instead of taps growing with the deviation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The stage plans once per raster size and keeps the plan with its targets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain arrays and retains nothing.
