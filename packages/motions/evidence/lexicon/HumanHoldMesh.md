# src/lexicon/HumanHoldMesh.ts#HumanHoldMesh.adapt

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their order, the result and the error.

## @evidence contracts/development/implementation.md#principled-implementation

Every key joint of both bodies is a mesh point; every parent-child pair is a bone at the target body's rest length; every contact keeps its key offset; the interaction mesh minimizes its Laplacian deformation under those, and each limb's goal is read off its adapted end and middle joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Points, bones, contacts, one adaptation, then the goals per body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing joint throws, never a dropped constraint.

## @evidence contracts/development/implementation.md#efficient-algorithms

One mesh and one adaptation per call, run once per key pose and pair, never per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mesh and its solve are `HumanInteractionMesh`'s.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function; the maps it returns are the caller's.
