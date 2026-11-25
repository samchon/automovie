# src/touch/kissPitch.ts#kissPitch

## @evidence contracts/development/common.md#meaningful-documentation

States the planar construction and each input's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The angles of the two in-plane components give the maximum dot product and therefore the least distance on the rigid circle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis and two dot products for atan2.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller keeps its own joint ranges and checks the actual displayed pose at the candidate angle.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure calculation on the caller's world frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The result is a scalar and owns no state.
