# src/formationSlotPosition.ts#formationSlotPosition

## @evidence contracts/development/implementation.md#principled-implementation

Closed-form row/file, square-root wedge row, arc angle or uniform-area scatter placement plus seeded dressing supplies each local point; a design laid in blocks takes the point from its block's layout and seed, turned by the block's facing with the same planar rotation and moved by its offset; optional previous/default design and target points blend before rest yaw and terrain relief. Unit cue translation/heading composes later through placeFormationSlot; fixed affine yaw itself does not distinguish local from equivalent world-point interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One public entry shares local layout/dressing helpers for the optional previous arrangement, default design and target; sequential reform changes its origin without adding another placement or dressing formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No layout or consumer is special-cased; scatter has no dressing because its layout declares none, and a missing reform is the designed arrangement rather than a fallback.

## @evidence contracts/development/common.md#meaningful-documentation

States frame order, relief, fromLayout/design origin, target dressing, shared consumers and invalid-slot RangeError; omitted fromLayout preserves the existing design-to-target call convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic per slot plus `formationGroundRelief`, which costs one ground lookup over the formation's terrain snapshot for the member and one cached lookup per record for the anchor; a full placement pass is linear in the member count and nothing is materialized per member.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Coordinates no work across requests itself; the anchor ground datum is reused per record inside `formationGroundRelief`, which answers that reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; each call returns a fresh vector the caller owns.
