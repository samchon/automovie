# src/everyday/handReach.ts#handReach

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, in which frame, against which surface and why the arm does not matter.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's and the digits' collider spans along the direction, read in the hand bone's frame, less the surface's point along it: the support function of the hand's own colliders.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shaped pose, one placement, then one span scan per direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The colliders are the body's own; no hand thickness is assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolution and the hand's own bones' forward kinematics per call; each direction then scans only the hand's and the digits' shapes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the rests' chin fist (`restGoals`) and the seated palms on the thighs (`seatedHands`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader holds one placement of the hand's bones and nothing else.
