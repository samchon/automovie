# src/actions/walkDelayed.ts#walkDelayed

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept, what moves, the event added and the units.

## @evidence contracts/development/implementation.md#principled-implementation

A shift of the plan's clock: the pose stays a pure function of the film second, and every share is mapped by the same shift, so events, contacts and poses agree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share map applied to the events, the windows and the decisive instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A share at zero, within 1e-12 of it against rounding, is read as "from the start", which a stepping plan uses only for the feet it starts standing on.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the events and windows, once per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the plan for as long as the returned plan is held.
