# src/validation/validateExtents.ts#validateExtents

## @evidence contracts/development/implementation.md#principled-implementation

Switch on primitive shape and require finite positive supported dimensions, including capsule length policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shape-specific dimensions belong here while collector scalar predicates provide their diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown shapes report a type fault; dimensions are not clamped or replaced by defaults.

## @evidence contracts/development/common.md#meaningful-documentation

Dimension paths and strictly-positive model-unit requirements are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

The closed shape menu and fixed fields give constant arithmetic/text work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Primitive model/affordance gates share these rules instead of their own extents validators.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only collector rows remain with the caller; no mesh tessellation or renderer resource is acquired.
