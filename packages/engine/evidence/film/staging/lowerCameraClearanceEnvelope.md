# src/film/staging/lowerCameraClearanceEnvelope.ts#lowerCameraClearanceEnvelope

## @evidence contracts/development/implementation.md#principled-implementation

A field-by-field structural copy of the two spheres, which preserves every value exactly and breaks aliasing with author input; validation is a separate, earlier step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lowering paired with one validator, so `stageScene` composes the camera without knowing the envelope's shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius or centre is adjusted, defaulted or clamped; the envelope reaches the scene exactly as accepted.

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied, the units, the `null` rig case, why the copy is deep, and the validator precondition.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Copies two spheres in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `stageScene` lowers each accepted camera's envelope once while composing, and nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the returned envelope with at most two spheres and two centres, owned by the scene camera, and retains nothing.
