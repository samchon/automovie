# src/everyday/blendGazeJoint.ts#blendGazeJoint

## @evidence contracts/development/common.md#meaningful-documentation

States the record written, the angles' units, the zero default and the weight's range.

## @evidence contracts/development/implementation.md#principled-implementation

A linear blend per clinical component, so weight 0 keeps the joint and weight 1 sets the asked angles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read and one write, shared by the gaze's neck, head and eye solves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp: the caller asks angles inside the joint's range.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Writes one fresh triple and retains nothing.
