# src/sport/hurdleClear.ts#hurdleClear.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A cubic Hermite root over the stance, a drag-free parabola over the flight timed by the run's horizontal speed, Bezier swings with exact bar points, and a forefoot landing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Approach and bar, places, root path, clock, rows, contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Distances and the flight are refused when outside their bounds, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Closed forms; constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the run-up reader, the obstacle reader, the swing path and the leg placement primitive.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains the places, the two swing readers and the clock.
