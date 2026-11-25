# src/vehicles/rideWheelchair.ts#rideWheelchair

## @evidence contracts/development/implementation.md#principled-implementation

A plan of legs gives the signed heading change, so the outer and inner axle ends travel different signed distances. Each spin is signed travel over circumference and wrapped to the knob range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose function over `AutoMovieArchetypeRide.along`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The unwrapped heading accumulates exact authored arc fractions on courses of legs. Both wheels still turn alike on timed curves, which do not expose unwrapped heading. Casters do not swivel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares the turns once. Sampling sums each turn's clamped extent with no integration or previous sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ride's plan is shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the chair and the plan for as long as the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, the rolling relation and how a performer can follow the rim.
