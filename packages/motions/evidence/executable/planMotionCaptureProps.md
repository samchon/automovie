# src/executable/planMotionCaptureProps.ts#planMotionCaptureProps

## @evidence contracts/development/common.md#meaningful-documentation

States what is sampled and what is copied.

## @evidence contracts/development/implementation.md#principled-implementation

A performer is a function of film seconds, so sampling it at exactly the instants the capture draws loses nothing the stills show.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map per member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Poses come from the case's own functions; nothing is interpolated or adjusted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Figures times (instants plus grid frames) pose evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per case.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain data and keeps nothing.
