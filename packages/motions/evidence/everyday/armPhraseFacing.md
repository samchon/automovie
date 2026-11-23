# src/everyday/armPhraseFacing.ts#armPhraseFacing

## @evidence contracts/development/common.md#meaningful-documentation

States the target-normal direction, the upright finger rule, the forward fallback for a vertical normal, the heading's unit and the world quaternion returned.

## @evidence contracts/development/implementation.md#principled-implementation

Projects world up onto the plane normal to the normalized target normal; below `VERTICAL` of projected length the normal is vertical and the performer's forward, which lies in that plane, takes its place. HumanHand.rotation then aligns the hand's anatomical axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the arm phrase's default facing apart from its transport and path plan; HumanHand remains the alignment owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fallback is the performer's own forward, not a world axis, so it turns with the body; no target or body is special-cased.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed vector work and one hand alignment, with no scan or algorithm choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arm phrase calls it once per arm at plan time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion and retains nothing.
