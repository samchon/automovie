# src/geometry/sweep/orientAutoMovieSweep.ts#orientAutoMovieSweep

## @evidence contracts/development/implementation.md#principled-implementation

Relative key-section turns interpolated by nlerp over the transported frame, the orientation rule of sweep-based deformation, with the fixed frame as the translational sweep's carrier.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One implementation of section orientation: `compileAutoMovieSweep` writes its stations' rotations once, and a posed sweep writes its bones' every frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rotations are not validated here; `compileAutoMovieSweep` refuses non-finite or zero ones and posing writes unit ones.

## @evidence contracts/development/common.md#meaningful-documentation

States the carried frame, the relative turn, the interpolation and its source, and the ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S stations: `update` is S transport frames and products; a frame query is one transport frame, an O(S) bracket search and a constant-size product, with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The relative turns are computed once per `update` and serve every query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains 8 S numbers, S flags and 40 numbers of frame and scratch, sized at creation and released with the orientation.
