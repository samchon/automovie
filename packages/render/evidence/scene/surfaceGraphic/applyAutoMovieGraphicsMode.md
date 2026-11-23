# src/scene/surfaceGraphic/applyAutoMovieGraphicsMode.ts#applyAutoMovieGraphicsMode

## @evidence contracts/development/common.md#meaningful-documentation

States what draws, what holds out, the backdrop, the associated colour the capture divides back, and the restore.

## @evidence contracts/development/implementation.md#principled-implementation

A colorless depth-writing material on every non-graphic mesh is a holdout: it occludes the graphics behind it and contributes no colour or alpha, so the plate's alpha is the visible graphics' coverage.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mode builder the render-mode boundary dispatches to; graphics keep their own materials.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No per-pixel compositing in the pass; the capture's straight-alpha conversion owns that.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two scene traversals and one shared holdout material.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each application swaps and restores once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle holds the swapped materials and the holdout until restore, which disposes the holdout.