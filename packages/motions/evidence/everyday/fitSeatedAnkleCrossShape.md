# src/everyday/fitSeatedAnkleCrossShape.ts#fitSeatedAnkleCrossShape.IShape

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

A collider with its bone, world pose and world bounds in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the ankle cross's fit and its sweep certificate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/everyday/fitSeatedAnkleCrossShape.ts#fitSeatedAnkleCrossShape.readShapes

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns.

## @evidence contracts/development/implementation.md#principled-implementation

The body's own colliders placed on the posed bones (`HumanColliders.preparePlaced`), each with its world bounds (`physicalShapeBounds`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `fitSeatedAnkleCross` with the other placed-shape reads it and its sweep share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the placed colliders per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/fitSeatedAnkleCrossShape.ts#fitSeatedAnkleCrossShape.distance

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity and its sign.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's exact pair distance of the two placed shapes (`physicalShapePairDistance`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `fitSeatedAnkleCross` with the other placed-shape reads it and its sweep share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pair query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/fitSeatedAnkleCrossShape.ts#fitSeatedAnkleCrossShape.boundsGap

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity.

## @evidence contracts/development/implementation.md#principled-implementation

The Euclidean norm of the per-axis separations of two axis-aligned boxes, zero on any overlapping axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `fitSeatedAnkleCross` with the other placed-shape reads it and its sweep share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
