# src/striking/footStrikeChamber.ts#footStrikeChamber

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `footStrike.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The knee folds before the hip at the front chamber's fixed down-and-forward share of the leg, above it for an axe kick, and on the far side of the travel at the same fold for a hook or a crescent, so the extension is the knee's opening.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `footStrike.plan`: its authored chamber ankle, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `footStrike.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `footStrike.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `footStrike.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/striking/footStrikeChamber.ts#footStrikeChamber.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `footStrike.plan` prepared before calling `footStrikeChamber`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `footStrikeChamber` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
