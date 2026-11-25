# src/production/IAutoMovieWorldRamp.ts#IAutoMovieWorldRamp.IInput

## @evidence contracts/development/design.md#principled-representation

Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

worldRamp constructs the existing IAutoMovieWorldSurface plane representation and four fresh footprint points; no separate ramp runtime is introduced.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Signed rise permits descent and zero permits a flat surface. walkable is authored permission rather than an inferred slope verdict, and finite inputs do not guarantee finite derived arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

Centreline and elevation inputs for a rectangular world-plane ramp. Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.
