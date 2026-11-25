# src/capture/applyMotionCaptureGhost.ts#applyMotionCaptureGhost

## @evidence contracts/development/common.md#meaningful-documentation

States what changes, why it lives here, material ownership, depth behaviour and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Standard three.js transparency: one unlit transparent material with depth writes disabled, drawn after opaque surfaces through a higher render order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal assigning one shared material.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An opacity outside (0, 1] throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the root's descendants.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every mesh shares one material.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function disposes the material this call created; replaced materials remain the figure owner's.
