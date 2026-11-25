# src/lexicon/carExitAnkleAt.ts#carExitAnkleAt

## @evidence contracts/development/common.md#meaningful-documentation

Describes the ordered portions of the ankle flight.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk interpolation follows the sill waypoint in the horizontal plane and reaches at least the required clearance before traversing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The path owns only ankle position. The caller keeps contact, orientation and bend.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the admitted waypoints and actual required height without rig-specific corrections.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates a fixed number of scalar curves and vector interpolations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both feet sample the same path law with their own waypoints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the sampled ankle position escapes the function.
