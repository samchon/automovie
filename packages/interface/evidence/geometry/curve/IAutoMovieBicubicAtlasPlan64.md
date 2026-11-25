# src/geometry/curve/IAutoMovieBicubicAtlasPlan64.ts#IAutoMovieBicubicAtlasPlan64.IResult

## @evidence contracts/development/design.md#principled-representation

Plans use millimetre grids on normalized charts while fan receipts store emitted model-metre positions and global indices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieBicubicAtlasPlan64 returns the state shared by registry creation and emission; the fan cache separates physical identity from render normals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Local omissions and retained coarse estimates remain in plans rather than being replaced by synthetic geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed input lifetime, shared mutable caches, per-patch ordering and unit-preserving arithmetic callbacks.
