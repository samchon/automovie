# src/physics/solveBallisticLaunch.ts#solveBallisticLaunch

## @evidence contracts/development/implementation.md#principled-implementation

Resolve displacement into axes relative to constant gravity and solve the fixed-speed ballistic quadratic; direct/high selects the lower/higher arc. Near-zero gravity and vertical displacement have dedicated analytic degeneracy branches; binary64 overflow/cancellation remain limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solver returns velocity and hit time; projectileAt owns subsequent state evaluation and moving-target iteration remains separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-9 degeneracy threshold is shared numeric policy, not a target-specific answer; unreachable, coincident or invalid requests return null without inventing a launch.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give metre positions, speed, acceleration, arc choice, positive time and null failure semantics; no promise of exact floating-point landing is made.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of projections, discriminants and roots gives O(1) time and constant temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

solveMovingLaunch reuses this analytic solver per candidate time; no result is cached across mutable target or gravity inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A fresh solution transfers to the caller; null and failure retain no iteration history, native handle or task.
