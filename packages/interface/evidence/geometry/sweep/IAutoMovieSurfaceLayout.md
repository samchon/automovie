# src/geometry/sweep/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout

## @evidence contracts/development/design.md#principled-representation

The per-patch quad grid with face-varying UVs and `(patch, s, t)` corners, the chart every tier shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arrays the cage record publishes, filled by one `emit` per patch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `check` refuses overlapping or misoriented patches instead of dropping faces.

## @evidence contracts/development/common.md#meaningful-documentation

States what each array holds and when to check.
