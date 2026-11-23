# src/scene/vector.ts#vector

## @evidence contracts/development/implementation.md#principled-implementation

Constructs Vector3 directly from the numerical owner's x/y/z without unit conversion; finite admitted coordinates and the same coordinate frame are caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One native value conversion is shared by instanced formation and instance-set realization rather than duplicating transform arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No axis correction, hidden normalization or fixture geometry is applied; the helper performs no independent coordinate validation.

## @evidence contracts/development/common.md#meaningful-documentation

States component preservation, metre/frame premise and independent returned value ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three scalar copies and one Vector3 allocation are fixed work, independent of geometry size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call creates an independent mutable vector, so equal values do not alias the source or another caller's transform.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned CPU object transfers to its caller; no native buffer, renderer or background task is acquired.
