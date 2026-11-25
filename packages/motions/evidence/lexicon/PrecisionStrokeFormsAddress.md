# src/lexicon/PrecisionStrokeFormsAddress.ts#PrecisionStrokeFormsAddress

## @evidence contracts/development/common.md#meaningful-documentation

States the chain from the contact to the floor point, the clear-pose search and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The contact, the grip and the shoulder lie on one line along the implement's working direction; the shoulder's offset from the floor point is the body's own at quiet stance and the facing given; the stance is accepted only where the arm planner, which lays the stroke's own course, finds its contact pose clear, the nearest such stance kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Contact, grip, shoulder, the stance's offset, then the scan and the bisection on the planner's verdict.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown row is refused, never given a default form; no clear stance is refused with the planner's own reason, never returned anyway.

## @evidence contracts/development/implementation.md#efficient-algorithms

One verdict when the line's place is clear; otherwise at most `2 SCAN + BISECT` more, each one stance and one one-instant course.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The working direction is the stroke's own (`axis`), the tool its own (`precisionStrokeTool`), the stance `stand`'s and the verdict the planner's (`fitClearArmPose`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
