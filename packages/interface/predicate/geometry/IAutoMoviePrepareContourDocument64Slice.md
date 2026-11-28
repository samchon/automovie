# src/geometry/IAutoMoviePrepareContourDocument64Slice.ts#IAutoMoviePrepareContourDocument64Slice

## @evidence contracts/development/common.md#meaningful-documentation

The slice names one retained physical coordinate and an owned local sequence of loop observations.

## @evidence contracts/development/design.md#principled-representation

Preparation preserves increasing cut order on admitted input, removes the supported empty event cut case and maps each surviving loop in saved order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The value holds a coordinate and its observation list. The individual source curve remains borrowed.

# src/geometry/IAutoMoviePrepareContourDocument64Slice.ts#IAutoMoviePrepareContourDocument64Slice.y

## @evidence contracts/development/common.md#meaningful-documentation

The value is the retained cut coordinate in physical millimetres.

# src/geometry/IAutoMoviePrepareContourDocument64Slice.ts#IAutoMoviePrepareContourDocument64Slice.loops

## @evidence contracts/development/common.md#meaningful-documentation

The array preserves original local loop ordinals and can remain empty on a retained cut.
