# src/actions/prepareSupportLiftCourse.ts#prepareSupportLiftCourse

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned, how it is read, the split rule with its tolerance and grid, the error it admits and when knots are made and dropped.

## @evidence contracts/development/implementation.md#principled-implementation

Adaptive piecewise-linear sampling of a scalar function of the share, each interval judged once at its middle against the solver's millimetre and refined to the frame grid; a knot is the exact lift the caller fits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fit the ends, descend judging each interval once, interpolate at the leaf.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every knot is the caller's exact lift; an interval is kept whole only where its middle's lift is within the tolerance of the line.

## @evidence contracts/development/implementation.md#efficient-algorithms

One exact lift a knot, at most the share over the grid's halvings deep along a read's path; a read past judged intervals costs a descent and one interpolation, with no fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Knots and judgements are kept and shared by every read until `clear`, which the interval calls when the schedule settles and its observations change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps at most two knots a grid interval of the share until `clear`.
