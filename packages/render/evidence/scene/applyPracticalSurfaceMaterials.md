# src/index.ts#applyPracticalSurfaceMaterials

## @evidence contracts/development/common.md#meaningful-documentation

States the frame clock, caller's mounting and resolution roles, failure conditions, original material path and reused-scene reset requirement.

## @evidence contracts/development/implementation.md#principled-implementation

Samples each track independently, resolves the exact built node-part mesh and material, then swaps pointers only after complete frame preflight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Engine owns the discrete key rule. Render resolves and validates target and variant references before applying the resulting assignments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No lookup by display name, mesh traversal, material mutation, shared model rewrite or previous-frame dependency. Missing and aliased targets fail before any assignments.

## @evidence contracts/development/implementation.md#efficient-algorithms

One target lookup, logarithmic key selection and one variant resolution per track, with one temporary assignment per target. Untracked shots return immediately.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All frames use the caller's prepared references. Reapplying a selected material requires no conversion or copy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No geometry, material or texture is allocated or disposed. Assignments borrow already-owned materials for live mesh slots and no auxiliary state persists.
