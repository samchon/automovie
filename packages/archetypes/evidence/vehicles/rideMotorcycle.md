# src/vehicles/rideMotorcycle.ts#rideMotorcycle

## @evidence contracts/development/implementation.md#principled-implementation

The steady-turn lean of `AutoMovieArchetypeCourse.lean`; `AutoMovieArchetypeCourse.admitLean` checks the limit at each bend's top speed, the fastest the course lets it be taken.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan unless planned, check every bend against the limit, then one pose function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A turn beyond the limit is refused, never flattened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ride's plan is shared by every sample, and the lean check is the one the bicycle's ride uses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the machine and the plan for as long as the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States what moves and the refusal.
