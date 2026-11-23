# src/floor/prepareLieDownFootPins.ts#prepareLieDownFootPins

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot selection, frames, window and retained course.

## @evidence contracts/development/implementation.md#principled-implementation

Selects each foot's lowest heel, ball or toe at the first lowered posture. Its translated ankle preserves the rotation and toe articulation from the current course while keeping that socket fixed from entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two immutable anchors precede the two current limb goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The actual entry and foot geometry determine the anchors. Their motion is never approximated by a common translation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two legs with a fixed number of soles and constant vector work per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same posed feet the route already reads for the pelvis path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps a body reference and its two anchors while the plan lives. The actual poses and bones do not escape the write.
