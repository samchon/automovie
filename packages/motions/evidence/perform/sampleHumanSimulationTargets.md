# src/perform/sampleHumanSimulationTargets.ts#sampleHumanSimulationTargets.of

## @evidence contracts/development/common.md#meaningful-documentation

States what is welded, at which step, and how the targets are admitted.

## @evidence contracts/development/implementation.md#principled-implementation

A segment's frame is its bone's world frame (`bindPhysicalWorld` places each rigid body at its bone's origin); the weld and the admission own their rules.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the segment frames, welds once, admits each step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment of the body's profile is read; nothing is dropped before the weld.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S * B) for S steps and B bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh frames and profile; retains nothing.
