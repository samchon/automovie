# src/terrain/planWallRunFlight.ts#planWallRunFlight

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the flown span between the `wallStep` and `catch` events, and the plan it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Between the two keys the root follows the projectile under standard gravity whose take-off velocity lands it on the hang's root in the stances' time; the joints blend from the frozen keys' angles by a minimum-jerk share, the arms over the flight's first half; contacts declared across the flight end at the take-off or start at the catch, as nothing bears in the air.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the run's flight phase over a support plan, apart from the stances `planWallRun` fits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Gravity is the engine's standard constant and the shares are minimum-jerk; no key, contact or time is adjusted to fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation reads the two keys once, freezes them once and fixes the blended bones and their arm flags; each query inside the flight is one pass over those bones, and outside it the support plan's own query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the support plan's keys and its posture outside the flight; nothing is cached across queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan holds the support plan, the two keys and the fixed bone list for its life; each query's posture ends on return.
