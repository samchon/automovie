# src/sport/poleVaultSwinging.ts#poleVaultSwinging

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `poleVault.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Linthorne 2000's flexible pole swings the vaulter as a point mass at the grip from the take-off velocity on a pole as stiff as its rating; the pole shows the chord's elastica on its hinges, bowed away from the vaulter, and the body turns with the chord about the planted tip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `poleVault.plan`: the swing on the bending pole, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `poleVault.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `poleVault.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `poleVault.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/sport/poleVaultSwinging.ts#poleVaultSwinging.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `poleVault.plan` prepared before calling `poleVaultSwinging`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `poleVaultSwinging` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
# src/sport/poleVaultSwinging.ts#poleVaultSwinging.ISwinging

## @evidence contracts/development/common.md#meaningful-documentation

Names the swing, the pole's bend and bow, and the swinging posture.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `poleVault.plan`'s file; its units and frames are those its members state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `poleVaultSwinging` and `poleVault.plan`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.
