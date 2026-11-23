# src/film/nodeSubjectExtent.ts#nodeSubjectExtent

## @evidence contracts/development/implementation.md#principled-implementation

Prefers computeModelRestExtent's portable part/proxy bound, then rig span, then stand-in height; a shared floor replaces unusable measured heights. The ordered-box and finite-arithmetic premises belong to the supplied measurements, and nodeSubjectBox recognizes the zero-width encoding exactly. This representation establishes no bound for unmeasured external bytes or renderer deformation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule for what a node fills, shared by the framing solve and the contract grade, so a shot is never graded against a subject nobody framed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height floor and stand-in are named constants applied to every node alike; a measured width is never discarded because the height was replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States what each argument is and what null means, the precedence, the zero-width encoding and who reads it, the height floor and its substitute, that a measured floor and width survive, and both consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one subtraction, one comparison and one box literal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its two arguments; `performShot` memoizes the measured extent it passes in, which is the expensive part.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result references the caller's `extent.min` and the caller owns it.
