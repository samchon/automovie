# src/lexicon/RideRestingHands.ts#RideRestingHands.IRest

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

A place and a turn in one frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both members are read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/RideRestingHands.ts#RideRestingHands.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The entry's displayed wrist and elbow, moved into the seated posture's root and heading frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward-kinematics read, then one transform per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the sides given are read; no side returns nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics read of the wrists and elbows per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `poseBones` and `humanPostureHeading`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns numbers only.

# src/lexicon/RideRestingHands.ts#RideRestingHands.place

## @evidence contracts/development/common.md#meaningful-documentation

States the input frames and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid carry by the posture's root and heading, the frame the pelvis rides in; the elbow is carried with the wrist, so the arm keeps the branch the entry displayed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One heading, two carried points and one carried turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goal is the carried wrist; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `humanPostureHeading`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal and retains nothing.
