# src/physics/physicalShapeSpan.ts#physicalShapeSpan

## @evidence contracts/development/common.md#meaningful-documentation

States the interval, its frame and unit and how the shape is placed.

## @evidence contracts/development/implementation.md#principled-implementation

The support function of each convex kind along the axis and its opposite: a sphere's radius, a capsule's projected half axis plus its radius, a box's projected half extents summed, a hull's extreme projected point (Ericson, Real-Time Collision Detection, 2005, ch. 9.5.3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per shape kind with an exhaustive check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No margin or sampling; every kind is projected exactly and an unknown kind throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant for a sphere, capsule and box, linear in a hull's points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
