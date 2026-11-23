# src/animals/QuadrupedTail.ts#QuadrupedTail.carry

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and when the model is returned unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The far end's signed distance to the footing beneath it is a sinusoid of the turn about the lateral axis through the dock; its zero nearest the posed carriage is the least turn, applied as a parent-local rotation of the tail bone and emitted through the same rig.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure, solve one sinusoid, re-emit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn is bounded by `ROM`; nothing is moved when the tail clears.

## @evidence contracts/development/implementation.md#efficient-algorithms

One landing query per sample; the read and emit run only when the tail would enter the footing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `QuadrupedWorldPose`'s read and emit, prepared once per animal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps one prepared pose per animal while it lives.
