# src/geometry/curve/IAutoMoviePrepareContourDocument64Slice.ts#IAutoMoviePrepareContourDocument64Slice

## @evidence contracts/development/design.md#principled-representation

A millimetre section coordinate and ordered loop observations preserve saved local incidence even when the loop list is empty.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared document passes these cuts to sampling and slab planning after supported empty event cuts are filtered.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retained empty cuts remain explicit; preparation does not fabricate a contour to fill a missing section.

## @evidence contracts/development/common.md#meaningful-documentation

Defines new versus borrowed storage, coordinate admission and retained loop ordering.
