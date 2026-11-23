# src/perform/planHumanSimulationBody.ts#planHumanSimulationBody

## @evidence contracts/development/common.md#meaningful-documentation

States what stays authored, what becomes physical and when, the release, the gravity compensation and the hand-back.

## @evidence contracts/development/implementation.md#principled-implementation

Kinematic motion with physical response only where a hit lands, blended back to the kinematic motion afterwards: Zordan, Majkowska, Chiu and Fast 2005, "Dynamic response for motion capture animation", ACM TOG 24(3):697-701. Sample k's policy owns the interval before it (`IAutoMoviePhysicalSimulationInput.ITarget`), so an impulse applied at step k's opening boundary meets its subtree already physical.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the step policy from the window's impulses, grips, groups and releases; the window's assembly owns those decisions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every gain and limit is the profile's; the only body settings are zero root actuation, the engine's default hand-back and its residual limits, the joint one widened to the range tolerance the displayed poses themselves are admitted within (`ROM_TOLERANCE`).

## @evidence contracts/development/implementation.md#efficient-algorithms

O((S + 1) * B) for S steps and B segments, with the descendant closure memoised per distinct bone set.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Steps with the same owned set share one frozen array, so the engine's ownership selection sees no change between them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh body that shares the caller's sampled poses; retains nothing.
