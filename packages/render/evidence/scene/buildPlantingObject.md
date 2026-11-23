# src/scene/buildPlantingObject.ts#buildPlantingObject

## @evidence contracts/development/implementation.md#principled-implementation

Composes each full member transform with local branch/leaf transforms into two prototype batches, preserving radius averaging, zero axial scale for zero-length branches and empty-batch point bounds. Positive-radius cylinder caps can remain planar at zero length; this adapter does not establish that such a slot is invisible.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The engine owns derivation/placement admission while this projection owns generated geometry/default materials and two finite acquisition lists for independent retirement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Mean branch radii are an explicitly lossy taper approximation, leaf transforms remain unchanged and no new segmentation/shape value is tuned to a fixture or unobserved visual target.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation states transform units/ordering, averaged taper cost, degenerate/empty behavior, borrowed materials and caller-owned scene withdrawal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P placements, B branches and L leaves, matrix/bounds work is O(P*(B+L)) with instance matrices of that size; scratch vectors/matrices and at most two geometries are reused within construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Members reuse one branch cylinder and one leaf plane with per-instance matrices instead of cloned scene trees; separate cluster construction is an owned effect and not cached by plant name.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Created geometries/defaults/instance owners are registered immediately and independently retired after partial failure or explicit sticky disposal; supplied materials are borrowed and population/instance bytes have no independent cap in this adapter.
