# src/scene/surfaceGraphic/applyAutoMovieGraphicsMode.ts#applyAutoMovieGraphicsMode

## @evidence contracts/development/common.md#meaningful-documentation

States what draws, what holds out, that a blended material holds out only its opacity, that formations and dual-quaternion skins hold out where beauty draws them, the backdrop, the associated colour the capture divides back, and the one-time restore.

## @evidence contracts/development/implementation.md#principled-implementation

A colorless depth-writing material on every non-graphic mesh is a holdout: it occludes the graphics behind it and contributes no colour or alpha, so the plate's alpha is the visible graphics' coverage. A blended material below full opacity is see-through in beauty, so its holdout writes no depth and blends a zero source over a one-minus-source-alpha destination at that opacity: the associated colour and alpha beneath it both scale by one minus the opacity, which keeps the straight colour and lowers the coverage to what beauty shows through the glass. The holdouts come from the shared material override, which carries a formation's baked cycle and a dual-quaternion skinning patch onto each replacement, so a held-out mesh occludes where the beauty pass draws it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mode builder the render-mode boundary dispatches to; the material swap, its patches and its restore belong to `overrideAutoMovieRenderModeMaterials`, which this builder calls with the graphic meshes kept, and graphics keep their own materials.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No per-pixel compositing in the pass; the capture's straight-alpha conversion owns that.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal collects the graphic subtrees and the override traverses the meshes once; each held-out mesh takes its own holdout because a cycle or skinning patch is per material.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each application swaps and restores once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The override's handle holds the swapped materials and the holdouts until restore, which disposes the holdouts; this handle's restore runs once and also puts the backdrop back.
