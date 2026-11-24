# src/cinematics/AutoMovieGuidePass.ts#AutoMovieGuidePass

## @evidence contracts/development/design.md#principled-representation

The closed union matches `AUTOMOVIE_GUIDE_PASSES`; `applyRenderMode` leaves beauty unchanged and dispatches structural builders that replace materials or add overlays, returning a restoration handle. Anonymous instanced actors have no scene bones for the pose overlay, so equal source frames do not imply equal represented populations across passes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A bare literal union with one member per pass is the whole vocabulary; how each pass is drawn belongs to the viewer and how its frames are named belongs to render, so the type carries only identity and meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union is the only structural constraint, with no wrapper alias or validator tag, and the runtime list lives in render because this package is pure types.

## @evidence contracts/development/common.md#meaningful-documentation

Names beauty as the shaded output, describes each structural projection and optional conditioning use, states depth normalization and mask fallback, that the graphics plate goes through a transition as beauty does where the structural passes show one shot, and identifies the runtime list and pose-population limitation.
