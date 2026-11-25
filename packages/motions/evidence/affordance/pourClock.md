# src/affordance/pourClock.ts#pourClock

## @evidence contracts/development/common.md#meaningful-documentation

States the five stages, their lengths' bounds and total, the tempo scaling, the tilt and gap admission and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The stages are staged inputs laid end to end as start events (`AutoMovieMotionClock.sequence`); a stage out of 0.2 to 3 seconds makes the total unusable, so one total check refuses any stage, the sum and the tempo-scaled sum together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the pour's timing admission and clock, moved from `pour` so its plan keeps the geometry; `pour.plan` is its only consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bounds are the pour's documented staged ranges; no consumer or case is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five stages, constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each plan builds its own clock from its own parameters.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned clock.
