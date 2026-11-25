# src/sport/poleVaultFinish.ts#poleVaultFinish

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `poleVault.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The release carries the centre at the chord's rate from the recoiled grip; the flight follows the centre's parabola until the lowest shape meets the landing surface, refused when the body is not above it; the plan's posture is the push-off, swing, flight or landing by phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `poleVault.plan`: the release, the flight, the landing and the plan, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `poleVault.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `poleVault.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `poleVault.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/sport/poleVaultFinish.ts#poleVaultFinish.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `poleVault.plan` prepared before calling `poleVaultFinish`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `poleVaultFinish` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
