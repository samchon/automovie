# src/render/measureAutoMovieFilmResponseTargets.ts#measureAutoMovieFilmResponseTargets

## @evidence contracts/development/common.md#meaningful-documentation

States which targets one film response stage holds at a raster, their texel sizes, the pyramid's depth rule, and which stages hold one.

## @evidence contracts/development/implementation.md#principled-implementation

Counts what render's `allocateAutoMovieFilmTargets` makes: the linear half-float frame and its depth texture, one half-float pyramid level per halving to the deepest glare kernel's level, and two blur targets per kernel at its level, each side rounded up as the stage rounds it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measure of one stage, read by the surface feeds' measure for each feed drawn through the film's optics, so a feed's stage is counted by the same rule as the film's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sizes follow the allocation and the contract's glare kernels; nothing is estimated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant in the raster: one pass over the three kernels and the pyramid's few levels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure arithmetic measure with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains and allocates nothing.
