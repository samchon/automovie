# src/sport/poleVaultTakeoffFrame.ts#poleVaultTakeoffFrame

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `poleVault.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The take-off's posture at its instant, resolved only for the holding arms' shoulders, gives their joints and the root the plant is laid on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `poleVault.plan`: the take-off's shoulders and root, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `poleVault.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `poleVault.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `poleVault.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/sport/poleVaultTakeoffFrame.ts#poleVaultTakeoffFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Names the take-off's holding shoulders and root.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `poleVault.plan`'s file; its units and frames are those its members state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `poleVaultTakeoffFrame` and `poleVault.plan`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.
