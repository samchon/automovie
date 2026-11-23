# src/film/handoffEvents.ts#handoffEvents

## @evidence contracts/development/implementation.md#principled-implementation

A fixed table maps the four kinds to start or end; ids concatenate kind, participants and the shared time formatter, preserving the documented rounding and delimiter collision limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separated from `coupleObjects` so the coupling baker states what it bakes while the event envelope, its id format and its order live in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every handoff gets the same four events with the same envelope; nothing depends on which child, parent or bone is involved.

## @evidence contracts/development/common.md#meaningful-documentation

States the four kinds and instants, participant roles, null point and reaction, id format and collision limits, shot-local unit, caller and absence of mount events.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: four events built from a four-entry table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure constructor of one handoff's events that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the four returned events.
