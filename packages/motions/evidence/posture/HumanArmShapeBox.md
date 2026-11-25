# src/posture/HumanArmShapeBox.ts#HumanArmShapeBox

## @evidence contracts/development/common.md#meaningful-documentation

States the bound, the frame it is read in, the box and the cases that bound nothing.

## @evidence contracts/development/implementation.md#principled-implementation

Outside the enclosing box its nearest point is at least as close as the hull. Inside the hull, leaving the box requires at least as much travel as leaving the hull, so the negative distance to the box boundary bounds signed clearance there as well. The result is lessened by `ROUNDING`, more than the rounding of the two rotations of a point a few metres out, so it stays a bound as computed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The point into the segment's frame, into the shape's, then one clamp per axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a bound: its callers decide nothing from it that the exact distance could reverse (`HumanArmTrajectoryPairs.deepest`).

## @evidence contracts/development/implementation.md#efficient-algorithms

Two rotations of a point and six comparisons after one O(V) pass over the hull's points for the box, against the exact query's support search over the hull's faces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The box is computed where the bound is read, from the hull's points; nothing is kept between queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Nothing is retained: the box is a local of the query.
