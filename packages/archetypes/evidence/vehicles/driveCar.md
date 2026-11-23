# src/vehicles/driveCar.ts#driveCar

## @evidence contracts/development/common.md#meaningful-documentation

States the steering relation, which point follows the path, the signs forward and reversing, the road wheels, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Low-speed Ackermann geometry: the road wheel angle is the arctangent of the wheelbase over the rear axle's path radius, and the hand wheel turns by the overall ratio times it. Reversing, the heading's rate is the speed over the wheelbase times the tangent of the angle with the speed's sign flipped, so a path bending the same way needs the opposite angle. Tyre slip at speed is left out, which holds for the walking-to-town speeds a staged scene uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan unless planned, admit every bend at the lock, then one pose function from curvature to the wheel's travel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The wheel steps to its angle at a turn's start because the course's curvature steps there; easing it in is a spiral leg the course does not have, stated here rather than hidden.

## @evidence contracts/development/implementation.md#efficient-algorithms

One arctangent per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ride's plan is shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the car and the plan for as long as the caller keeps the ride.
