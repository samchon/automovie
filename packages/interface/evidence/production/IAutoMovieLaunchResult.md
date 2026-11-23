# src/production/IAutoMovieLaunchResult.ts#IAutoMovieLaunchResult

## @evidence contracts/development/design.md#principled-representation

Impact time and velocity come from the closed-form ballistic solve, `solveBallisticLaunch` for a static target or `solveMovingLaunch` leading a moving one, and the hit point is `projectileAt` evaluated at that time, so the clip, the reaction and the events all share one computed contact rather than an authored guess. The moving-target lead is a fixed-point iteration capped at eight steps; for a target faster than the projectile it returns the closest lead found, so `hitPoint` is where the flight lands and can differ from where the target is at `hitTime`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups the flight clip, the optional reaction, the impact numbers and the events because `performShot` needs all of them from the same solve, and the numbers stay exposed so a caller can place the clip and check the landing against the shot length without re-solving.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reaction is withheld rather than invented when there is no `onHit` or no single target node, and when the incoming velocity is degenerate its direction falls back to the origin-to-impact line, a stated geometric fallback rather than a fixture value.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its null case, what `performShot` does with each field, the clip's local clock, when `react` is null and where its source point sits, the units and clock of each number, and which events are emitted when.
