# src/reaction/thrown.ts#thrown.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The projectile p(t) = p0 + v t + g t^2 / 2 with the vertical speed sqrt(2 g h) that rises h and the horizontal speed that covers the distance in the time it takes to fall to the lying height; the shape blends linearly from the rig's to the lie over the flight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, read the direction, solve the flight time, then evaluate each posture in closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The flight comes from the authored distance and height; the lying height is measured on the body.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fit and one measure at plan time; constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the knockdown's lie fit and floor measure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the flight constants and the two shapes.
