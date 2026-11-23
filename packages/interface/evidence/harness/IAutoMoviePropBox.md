# src/harness/IAutoMoviePropBox.ts#IAutoMoviePropBox

## @evidence contracts/development/design.md#principled-representation `transformedBoxBounds` takes per-axis extrema of eight transformed corners, the exact-real axis-aligned bound of an affine box image. It encloses the rotated volume rather than preserving its orientation; binary64 products/sums can round or overflow even for finite authored bounds and transforms, and this local box gate does not validate the derived world bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two corners describe the volume, and `IAutoMovieClearanceBox` extends this record with an id, so footprints and clearances share one corner rule and one transform.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A flat, inverted or non-finite box is refused rather than widened by a tolerance or reordered.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit, where the box is used, the corner rule and its validator, and how staging transforms it; members give each corner's role and bound.
