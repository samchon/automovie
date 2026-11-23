# src/physics/physicalShapeSupport.ts#physicalShapeSupport

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping, its source and each kind's closed form.

## @evidence contracts/development/implementation.md#principled-implementation

The support of a Minkowski sum is the sum of supports, so a round shape is its core's support plus its radius along the direction; a polytope's support is a vertex.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame change into the shape and one closed form per kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exhaustive over the shape kinds; an unknown kind throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for the round shapes and the box, O(V) for a hull.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.
