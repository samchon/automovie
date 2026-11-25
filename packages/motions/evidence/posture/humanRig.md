# src/posture/humanRig.ts#humanRig

## @evidence contracts/development/common.md#meaningful-documentation

States what the rig is and why it matches the display.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's canonical humanoid axes and rest frames with the body's own skeleton.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of the rig value in motions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cast or copy; the tables are the engine's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
