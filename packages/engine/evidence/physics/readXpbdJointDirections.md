# src/physics/readXpbdJointDirections.ts#readXpbdJointDirections

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the order of the directions and how the locked ones complete the basis.

## @evidence contracts/development/implementation.md#principled-implementation

The free directions are the joint's motion subspace as the articulated solve uses it, the chart's axes at the configuration (Featherstone 2008, chapter 4, the motion subspace of a joint model); the locked ones complete them to a basis, so the dual basis gives each coordinate's gradient as MuJoCo's per-degree-of-freedom rows have it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the chart's axes, take the free ones in axis order, complete by a normal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chart reading and a few vector products.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one joint at one configuration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors; retains nothing.
