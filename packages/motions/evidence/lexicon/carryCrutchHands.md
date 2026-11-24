# src/lexicon/carryCrutchHands.ts#carryCrutchHands

## @evidence contracts/development/common.md#meaningful-documentation

States the chord the support course lays, what the offset is, its unit and frame and that keys are left unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid translation of a held arm goal and its pole by the grip's displacement keeps the hand's rotation and its grip on the crutch; the offset vanishes at the keys, so the course stays continuous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The law owns its crutch track and computes the offset; this function only applies it to the arm goals the support course wrote.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hand place is authored apart from the crutch's track; an arm with no held goal is left to the support course.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two offset reads and at most two goal copies per posture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is one posture's own; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.
