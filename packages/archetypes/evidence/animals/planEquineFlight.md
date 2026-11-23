# src/animals/planEquineFlight.ts#planEquineFlight

## @evidence contracts/development/common.md#meaningful-documentation

States the two stages and the failures.

## @evidence contracts/development/implementation.md#principled-implementation

The closed form reads the body at the middle of a nominal flight; the flown ride's own parts are then measured through the whole flight, so the result rests on the displayed geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, then a bounded measure-and-extend loop; kept apart from `rideQuadruped` for its size.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clearance is relaxed; a flight still short refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most `ROUNDS` + 1 trial assemblies and flight measurements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each round reuses the ride's own assembly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the current flight between rounds.
