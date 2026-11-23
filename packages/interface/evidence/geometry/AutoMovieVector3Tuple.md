# src/geometry/AutoMovieVector3Tuple.ts#AutoMovieVector3Tuple

## @evidence contracts/development/design.md#principled-representation

A fixed x/y/z tuple preserves Cartesian component order while each field determines its physical units and reference frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Solid-vector algebra, Human geometry and recovery share one tuple owner; object vectors retain their distinct representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Triangle indices, Euler angles, derivative jets and random state words are not Cartesian vectors merely because they have three components.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes source frames and units, mutable results and borrowed views, and the numerical caller's validation obligations.
