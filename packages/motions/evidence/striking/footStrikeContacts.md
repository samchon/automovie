# src/striking/footStrikeContacts.ts#footStrikeContacts

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `footStrike.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The kicking foot is planted until its release share; the support foot pivots on its ball over the whole strike, or before and after a jump's flight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `footStrike.plan`: its contact windows, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `footStrike.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `footStrike.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `footStrike.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/striking/footStrikeContacts.ts#footStrikeContacts.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `footStrike.plan` prepared before calling `footStrikeContacts`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `footStrikeContacts` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
