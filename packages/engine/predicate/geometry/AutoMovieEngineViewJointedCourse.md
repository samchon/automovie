# src/geometry/AutoMovieEngineViewJointedCourse.ts#AutoMovieEngineViewJointedCourse.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted finite segments, physical-millimetre turn records and diagnosed separation, turn and arclength failures.

## @evidence contracts/development/implementation.md#principled-implementation

The owner rejects unrepresentable separations before normalizing their directions. It derives each angle and setback from adjacent segments, checks that their occupied distances fit, and dates the admitted turns along finite physical arclength.

## @evidence contracts/development/implementation.md#efficient-algorithms

One preparation walks the segment and turn lists with a fixed-order turn integral per bend. The prepared directions, distances and turns are shared by run placement and axis readers.
