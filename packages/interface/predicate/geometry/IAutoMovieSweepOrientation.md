# src/geometry/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation

## @evidence contracts/development/common.md#meaningful-documentation

Reusable section plane compiler whose station rotation buffers can be rewritten for pose updates.

## @evidence contracts/development/design.md#principled-representation

Update takes each authored absolute quaternion into the carried frame. Queries use the carried basis turned by normalized interpolation of the bracketing relative rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record exposes writable station inputs and caller-owned output buffers. Per-station relative turns remain inside the compiler.

# src/geometry/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation.rotations

## @evidence contracts/development/common.md#meaningful-documentation

Writable packed absolute x, y, z, w rotations, four scalars per station. Slots are read when selected by given.

# src/geometry/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation.given

## @evidence contracts/development/common.md#meaningful-documentation

Writable flag per station. Zero keeps the carried frame at that station and one reads its rotation slot.

# src/geometry/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation.update

## @evidence contracts/development/common.md#meaningful-documentation

Recompute relative turns after the current spine transport and station rotations have been written.

# src/geometry/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation.frame

## @evidence contracts/development/common.md#meaningful-documentation

Write metre origin, unit first axis, unit second axis and unit normal in that order, three scalars each.
