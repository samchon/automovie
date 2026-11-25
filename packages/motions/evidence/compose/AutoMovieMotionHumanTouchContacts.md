# src/compose/AutoMovieMotionHumanTouchContacts.ts#AutoMovieMotionHumanTouchContacts.sided

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A row is written for the right hand leading, so a left-led touch exchanges the sides of the bones as it exchanges its hands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check, then one filter and one map per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rest of an arm the touch does not move is refused, not dropped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the declared rests with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing computed twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Closes over its arguments only.

# src/compose/AutoMovieMotionHumanTouchContacts.ts#AutoMovieMotionHumanTouchContacts.windows

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the kind and the span.

## @evidence contracts/development/implementation.md#principled-implementation

A rest holds while the hand is on its region, the span the hand's own window covers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hand's window, then one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the rests with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing computed twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
