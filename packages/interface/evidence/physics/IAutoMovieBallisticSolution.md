# src/physics/IAutoMovieBallisticSolution.ts#IAutoMovieBallisticSolution

## @evidence contracts/development/design.md#principled-representation

The fields are exactly solveBallisticLaunch and solveMovingLaunch's successful closed-form/intercept output; compileLaunch passes them to projectileAt and the compiled launch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates a successful numeric solution from the projectile origin/gravity inputs without duplicating trajectory samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record does not guarantee an obstacle-free route or arbitrary-precision discriminant evaluation; solver numeric admission remains authoritative.

## @evidence contracts/development/common.md#meaningful-documentation

Member comments state velocity magnitude intent, world units, seconds and positive successful flight time.
