# src/film/pointSubjectBox.ts#pointSubjectBox

## @evidence contracts/development/implementation.md#principled-implementation

Offsets the point's Y by the two ends of the vertical span and keeps X and Z, which is the exact box of a vertical segment; it relies on `extent.min <= extent.max`, which `nodeSubjectExtent` guarantees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The degenerate half of node boxing owns the world-vertical stand-in policy; nodeSubjectBox deliberately passes translation alone, even when a measured vertical segment has the same shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No width is invented for an unmeasured subject; the box stays zero wide for every caller.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and units of both arguments, that the floor is relative, why the box has no width, which subjects reach it, and how it relates to `nodeSubjectBox`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: two additions and one box literal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure constant-time constructor that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Copies three coordinates into two new corners and keeps no reference to the point or the extent record.
