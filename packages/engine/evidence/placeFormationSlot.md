# src/placeFormationSlot.ts#placeFormationSlot

## @evidence contracts/development/implementation.md#principled-implementation

Transform the designed point about the unit anchor using unit spacing, heading and translation, then rotate the member-local offset by the unit heading and add both heading offsets. Terrain height is inherited from the designed point rather than resampled after cue displacement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared composition owner serves gates, review frames and rendering; point and local-offset helpers keep coordinate conventions explicit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No consumer gets a separate placement formula; absence is passed through as member.present, and the function does not invent ground support for moved slots.

## @evidence contracts/development/common.md#meaningful-documentation

Props give world metre positions, degree headings, unit/member cue ownership and the present result; terrain validation remains the final placed-world gate's responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of yaw, scale and translation operations gives O(1) work and one new placement per slot.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The canonical formula is shared across consumers; values are recomputed from current mutable cue states rather than cached by slot identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs are borrowed and the returned position is fresh; no cue, terrain, handle or task is retained beyond the call.
