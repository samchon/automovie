# src/index.ts#applyDualQuaternionSkinning

## @evidence contracts/development/implementation.md#principled-implementation

Registers the dual quaternion vertex patch through the shared ordered compile hook, so it composes with relief and detail patches and enters the program key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A one-line owner gives buildModel a named step, while the descriptor and GLSL stay in their own files.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the existing patch mechanism rather than replacing SkinnedMesh or Three's chunks globally, so plain materials keep linear skinning.

## @evidence contracts/development/common.md#meaningful-documentation

States the effect, the no-skinning behaviour and the register-before-compile premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds one descriptor; compile-time cost is the vertex transformation's string work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stable key lets equivalent materials reuse one compiled program.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The material retains the descriptor until its owner disposes it; no GPU resource is acquired here.
