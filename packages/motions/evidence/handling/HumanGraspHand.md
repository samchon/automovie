# src/handling/HumanGraspHand.ts#HumanGraspHand.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed body and hand, the target and degree tilt, and the world wrist returned.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's grip normal and forward are aligned with the approach and the wrapped axis, the result turned about the approach by the tilt, and the wrist placed so the flat palm's point lies half the width back from the grip point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One geometry read, one alignment, one tilt, one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The width is the target's own; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two hand-offset reads per preparation; constant rigid work per goal, no IK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grip frame and palm offset depend only on the body and side; each target computes its own wrist.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the hand's constant-size geometry until released; outputs are fresh.

# src/handling/HumanGraspHand.ts#HumanGraspHand.turns

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed body, hand and target, the degree inputs and the equivalence with `prepare`.

## @evidence contracts/development/implementation.md#principled-implementation

The turned approach, its alignment and the palm's near point depend on the turn alone, so the last turn's are kept while its tilts vary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same geometry, tilt and placement helpers as `prepare`, fed by one last-turn record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every turn and tilt computes its own wrist; `Object.is` tells signed-zero turns apart.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T turns of L tilts each, T alignments and near points instead of T*L.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The kept record depends only on the turn and the fixed target, and is replaced when the turn changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One hand geometry and one last-turn record until the reader is released.
