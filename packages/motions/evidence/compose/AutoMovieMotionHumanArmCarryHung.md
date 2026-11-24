# src/compose/AutoMovieMotionHumanArmCarryHung.ts#AutoMovieMotionHumanArmCarryHung

## @evidence contracts/development/common.md#meaningful-documentation

States which ends are let out and what the carry writes off its plan.

## @evidence contracts/development/implementation.md#principled-implementation

A hanging arm is let out at the shoulder by the least abduction that keeps it clear (`HumanArmSwing`), read where the span leaves and regains the arm, against the room the arm entered with.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One entry room, then at most two let-out reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An end the carry names keeps its own arm; an unchanged rest returns the carry itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two arm-swing reads at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanArmSwing` and `HumanArmClearance.baseline`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns fresh records.

# src/compose/AutoMovieMotionHumanArmCarryHung.ts#AutoMovieMotionHumanArmCarryHung.entering

## @evidence contracts/development/common.md#meaningful-documentation

States the room read and why it is the arm's own.

## @evidence contracts/development/implementation.md#principled-implementation

The rest arm's room in the action's first posture, read as the hanging-arm owner reads a room (`HumanArmClearance.baseline`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve and one baseline read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arm's goal is removed and its rest written, so the room is the rest arm's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanArmClearance.baseline`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns fresh records.
