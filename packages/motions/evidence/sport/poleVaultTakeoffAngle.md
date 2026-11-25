# src/sport/poleVaultTakeoffAngle.ts#poleVaultTakeoffAngle

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `poleVault.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The rise is Linthorne and Weetman 2012's regression of take-off angle on run-up speed, 48.8 - 3.51 v degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `poleVault.plan`: the take-off's rise, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `poleVault.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `poleVault.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `poleVault.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
