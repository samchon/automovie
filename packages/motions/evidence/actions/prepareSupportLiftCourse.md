# src/actions/prepareSupportLiftCourse.ts#prepareSupportLiftCourse

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned, how it is read, the split rule with its tolerance and grid, the error it admits and that every knot is made as the course is prepared.

## @evidence contracts/development/implementation.md#principled-implementation

Adaptive piecewise-linear sampling of a scalar function of the share, each interval judged once at its middle against the solver's millimetre and refined to the frame grid; a knot is the exact lift the caller fits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fit the ends and tessellate the whole share at preparation, each interval judged once; a read descends the prepared tree and interpolates at its leaf.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every knot is the caller's exact lift; an interval is kept whole only where its middle's lift is within the tolerance of the line.

## @evidence contracts/development/implementation.md#efficient-algorithms

One exact lift a knot, at most the grid's halvings deep, all at preparation; a read costs a descent and one interpolation, with no fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Knots and judgements are prepared once and shared by every read; the interval prepares a new course when the schedule settles its observations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps at most two knots a grid interval of the share for the course's life.
