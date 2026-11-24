# src/compose/AutoMovieMotionHumanTouchStancePrimitives.ts#AutoMovieMotionHumanTouchStancePrimitives

## @evidence contracts/development/common.md#meaningful-documentation

States what the primitives write and what they read.

## @evidence contracts/development/implementation.md#principled-implementation

The girdle, the heels and the turn follow the stroke's envelope; the lean is read at the full rise, so its angle does not change with the share of the rise shown; a correction writes over the settled posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stance's primitives, moved verbatim from `AutoMovieMotionHumanTouchStance.solve`, read the scope the solve hands them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stance that moves nothing writes no primitive; every other stance writes the channels it moves.

## @evidence contracts/development/implementation.md#efficient-algorithms

One primitive at most per stance; each write is closed-form but the lean's pitch, the feet's fit and the lowering.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stance's moves, its lean and the raw lowering.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitives retain the scope until released with the plan.

# src/compose/AutoMovieMotionHumanTouchStancePrimitives.ts#AutoMovieMotionHumanTouchStancePrimitives.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the stance solved.

## @evidence contracts/development/design.md#principled-representation

The solve's own values, named, so the primitives read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Twelve members, each read by the primitives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the solve's final values as they are; nothing is copied or derived.
