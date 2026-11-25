# src/geometry/sweep/IAutoMovieMonotone.ts#IAutoMovieMonotone.ISlopeSlopes

## @evidence contracts/development/common.md#meaningful-documentation

Writable slots 0 through n-1 hold Fritsch-Carlson first derivatives in ordinate units per knot unit. The index signature supports ordinary and typed arrays without a required length property; the caller supplies at least n writable slots.

## @evidence contracts/development/design.md#principled-representation

Writable slots 0 through n-1 hold Fritsch-Carlson first derivatives in ordinate units per knot unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMonotone.slope fills this caller-owned buffer and evaluate reads the resulting slopes; the kernel retains no storage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The index signature supports ordinary and typed arrays without a required length property; the caller supplies at least n writable slots.
