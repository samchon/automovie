# src/perform/resolveBoneTarget.ts#resolveBoneTarget

## @evidence contracts/development/implementation.md#principled-implementation

Uses clinical humanoid axes and the context's rest frames in resolvePose, whose root-inclusive model FK is then rotated by staged +Y facing and translated by context position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bone target resolution owns context lookup, optional sampling and world placement; it delegates joint constraints/FK to the existing canonical resolver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It does not substitute a nearby bone or guessed geometry for a missing target; context representation is rigid staging with no nonuniform node scale.

## @evidence contracts/development/common.md#meaningful-documentation

States world metres, sampled/rest fallback, root-once ordering, clinical frame pairing and null failures; this low-level public resolver has no current production caller beyond tests.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sample when motion exists, one skeleton index and joint admission pass, then FK for the target and its ancestors; output storage is the delegated FK array plus one fresh target vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one sampled pose feeds the entire FK; no cross-target cache is used because context rig, motion and time are caller-controlled without revision identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs are borrowed and the resolved array is invocation-local; the caller owns the returned vector, and no rig cache or running task is retained.
