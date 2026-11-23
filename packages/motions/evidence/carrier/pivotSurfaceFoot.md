# src/carrier/pivotSurfaceFoot.ts#pivotSurfaceFoot

## @evidence contracts/development/common.md#meaningful-documentation

Describes the initial frame, local units and retained point.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract the displacement that a local rotation would add to the support and add the opposite displacement to the ankle goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compose one rotation then apply one pivot correction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the given local contact in the limb goal so that joint limit correction retains it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant rotation and vector arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the engine's quaternion and vector operators. Ice and snow use the same pivot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure query which retains no records.
