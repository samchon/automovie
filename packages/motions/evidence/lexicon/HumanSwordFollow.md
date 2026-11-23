# src/lexicon/HumanSwordFollow.ts#HumanSwordFollow

## @evidence contracts/development/common.md#meaningful-documentation

States what is followed, why the target is read at the decisive instant, the continuity, the mutual-read rule and the unfollowed targets.

## @evidence contracts/development/implementation.md#principled-implementation

A declared landing meets the target where it is at contact; the difference from the planned point is superposed as one minimum-jerk unit over the attack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the target at the contact, one superposed unit, a re-entrancy guard and a settle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stationary target gives a zero unit and the planned landing unchanged; a point target is not read at all.

## @evidence contracts/development/implementation.md#efficient-algorithms

One target read per settled plan, then constant work per second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's surface placement and superposed minimum-jerk reader; the contact read is kept until the plan settles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The follower retains one unit at most, dropped on settle and released with the plan.
