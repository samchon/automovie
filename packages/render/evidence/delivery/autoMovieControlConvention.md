# src/delivery/autoMovieControlConvention.ts#autoMovieControlConvention

## @evidence contracts/development/common.md#meaningful-documentation

States that each convention is the one the draw page draws and where the mask's comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The draw page applies passes through `applyRenderMode` with its defaults, so the depth range is `DEPTH_NORMALIZATION_RANGE` and the outline width `EDGE_WIDTH`; the mask's palette is the one the page reported, because `applyRenderMode` chooses it in the page.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive switch over the union's control passes, so a new pass is a compile error until it has a convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Values come from the constants the passes use, never restated numbers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
