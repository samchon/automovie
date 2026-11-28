# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry

## @evidence contracts/development/common.md#meaningful-documentation

The record states what shares a spatial frame and separates resident identity, actual bounds and initial partition centre.

## @evidence contracts/development/design.md#principled-representation

The hierarchy uses the centre when ordering splits. Candidate collection compares real bounds and sorts by the first shared cell then original ordinal, including for entries reached in a different traversal order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An entry adds four spatial fields to the resident subtype. Its narrow-phase geometry stays in the subtype.

# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry.ordinal

## @evidence contracts/development/common.md#meaningful-documentation

The unique ordinal addresses an original object and breaks ties in candidate order.

# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry.low

## @evidence contracts/development/common.md#meaningful-documentation

The array gives actual XYZ lower bounds in the shared metre frame.

# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry.high

## @evidence contracts/development/common.md#meaningful-documentation

The array gives actual XYZ upper bounds in the same frame.

# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry.centre

## @evidence contracts/development/common.md#meaningful-documentation

The array gives the finite partition point and explains the overflow-safe half-sums used by the crossing owner.
