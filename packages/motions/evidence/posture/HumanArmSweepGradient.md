# src/posture/HumanArmSweepGradient.ts#HumanArmSweepGradient

## @evidence contracts/development/common.md#meaningful-documentation

Defines the reading, exceptional feature and returned derivative.

## @evidence contracts/development/implementation.md#principled-implementation

Interior minimization of the maximum of two affine plane distances has nonnegative KKT face multipliers summing to one and zero weighted slope along the segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two active planes must bracket zero slope; a third, absent or flat face leaves the original reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither clearance nor the admitted waypoint threshold changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only a penetrating hull with an interior witness and nonstationary reported face needs the face walk.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the physical hull's own face representation, the same transforms and the native minimizer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only two transient face references are retained during the walk.
