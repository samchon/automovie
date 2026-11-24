# src/handling/pianoScoreHand.ts#pianoScoreHand

## @evidence contracts/development/common.md#meaningful-documentation

States what it finds: the voicing a hand plays at a second, or the one it travels to, and how far.

## @evidence contracts/development/implementation.md#principled-implementation

The voicings are ordered by their end; a binary search finds the first that ends at or after the second, and the transport is the interval progress from the previous voicing's end to its start. Past the last voicing the hand returns over the minimum-jerk share toward its return second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `pianoScore` as the one read of a hand's timeline, which the arm and finger writers share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: every share is read from the score's own times.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic in the hand's voicings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of the timeline.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
