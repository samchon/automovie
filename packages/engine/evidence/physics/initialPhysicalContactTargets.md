# src/physics/initialPhysicalContactTargets.ts#initialPhysicalContactTargets

## @evidence contracts/development/common.md#meaningful-documentation

States the articulated pose and world-root authority.

## @evidence contracts/development/implementation.md#principled-implementation

Finds the profile's single root and uses joint projection followed by rigid pose rebasing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function only establishes the seed from the authored targets and actual placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the full articulated tree and its root displacement through both existing pose operators.

## @evidence contracts/development/implementation.md#efficient-algorithms

Runs once per prepared body before rows and numerical probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the established projection and rebasing operations for both fit modes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned projected poses and retains no borrowed input.
