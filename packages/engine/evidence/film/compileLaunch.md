# src/film/compileLaunch.ts#compileLaunch

## @evidence contracts/development/implementation.md#principled-implementation

Solves the closed-form ballistic aim, or its fixed-point lead against a moving target sampled at `action.start` plus flight time, samples the closed-form flight so there is no integration drift, and derives the recoil source one metre up the incoming velocity, falling back to the sightline when the projectile arrives still.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Orchestrates the physics primitives and owns only what joins them into a verb: the react, the events and their ids; shifting the clip onto the shot clock and suffixing repeated flights stay with `performShot`, which owns the shot's object-motion list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no projectile or target; standard gravity follows world down, the stillness threshold guards a zero direction, and a requested recoil without a struck node is refused instead of silently omitted or assigned to an arbitrary group member.

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved and baked, when a react is scheduled, the leading behaviour, the time base of every output including `targetAt`, the events emitted and their ids, the clip id, and the null case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Static aim takes constant local work; leading adds a bounded fixed-point iteration whose targetAt callback cost is delegated. Output construction then grows with the flight's sampled frame count, O(hitTime × fps), and retains each emitted key.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call compiles one launch from its own inputs and coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned clip, at most one react and three events.
