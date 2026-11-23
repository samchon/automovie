# src/scene/inspection/readAutoMovieNativeRigidFrame.ts#readAutoMovieNativeRigidFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted matrix premise, positive scales, retained translation and rotation, and basis tolerance.

## @evidence contracts/development/implementation.md#principled-implementation

Decomposes the actual matrix and compares the normalized basis columns against the reconstruction. Nonfinite, reflected, singular and sheared bases cannot serve as this rigid reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three owns decomposition and composition. The adapter only admits the resulting basis for its rigid distance checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A matrix valid for display can still be refused as a rigid contact frame. Failed admission does not use a world-up, identity or approximate rendered surrogate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs fixed-size matrix operations and visits only the nine basis components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the same extraction across support, hand and prop references.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no matrix reference or host object after the call. The new position and quaternion are owned by the caller.
