# src/physics/IPhysicalContactPoseReference.ts#IPhysicalContactPoseReference

## @evidence contracts/development/common.md#meaningful-documentation

A missing key identifies a fixed reference. The reader returns its world pose.

## @evidence contracts/development/design.md#principled-representation

One read and dependency express the same bone in either an adjustable tree or a fixed snapshot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A row captures only the pose read and its candidate identity during the fit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A value borrowed from a fixed snapshot has no derivative key.

# src/physics/IPhysicalContactPoseReference.ts#IPhysicalContactPoseReference.read

## @evidence contracts/development/common.md#meaningful-documentation

Names the candidate input, the world-pose result and the fixed-reference case.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The resolver that builds the reference owns the read.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This signature has no executable body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

This signature has no executable body.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The resolver owns the read's cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This signature contains no work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The resolver owns any state the read borrows.
