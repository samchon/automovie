# src/animals/QuadrupedWorldPose.ts#QuadrupedWorldPose

## @evidence contracts/development/implementation.md#principled-implementation

Rigid forward kinematics over the fixed parent-local attachments; Bollo's quintic inertialization of rotation-vector and translation offsets through the engine's `inertializeOffset`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the neutral rig once; read, emit, capture and blend are four small stateless operations over it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone length or attachment changes; a bone missing from a read model is refused by the skeleton reader rather than left at a default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each read, emit and blend is O(B) in the 21 bones plus the carrier emission's O(P+A); capture is O(B) once per cut.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The neutral frames, parent order and rest attachments are prepared once and shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the neutral frames and attachments of one animal; every returned pose and model is the caller's.

## @evidence contracts/development/common.md#meaningful-documentation

States the representation, its frames, the read and emit inverse pair and the cited blending method with its continuity guarantee.
