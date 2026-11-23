# src/architecture/rideSwing.ts#rideSwing

## @evidence contracts/development/implementation.md#principled-implementation

The small-angle pendulum period with the seated-pumping amplitude increment per half swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the inputs, list the turning points once, then read the half swing a second falls in.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The increment is the caller's, computed from the rider's body; the ride only applies it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the half swings to list turning points; each read finds its half swing in constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The turning points serve every read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one angle per half swing while the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the pendulum, the pumping rule with its source and the smooth half swing.
