# src/perform/placeHumanSimulationImpulses.ts#placeHumanSimulationImpulses

## @evidence contracts/development/common.md#meaningful-documentation

States the step rule, the point and the segment struck.

## @evidence contracts/development/implementation.md#principled-implementation

The engine applies an impulse at the opening boundary of its step, so the nearest boundary to the authored instant is the step's start; the world point is read on the same displayed bones the targets are sampled from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one placement per impulse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sustained forces are not impulses and are left to the laws that read them; an impulse outside the window or on another performer is left out.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F) for F forces plus an ancestor walk per impulse.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the displayed bones the window already sampled.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; retains nothing.
