# src/touch/touchHand.ts#touchHand

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `touch.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The hand is laid on its region as its layout lays it, its elbow hint from where it meets its place (end on from the elbow, or a held tool's kept grasp), and a ruled or drawn site's disc shrunk by the offset it already lies off the region, read once at the entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `touch.plan`: one touching hand's primitives, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `touch.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `touch.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `touch.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/touch/touchHand.ts#touchHand.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `touch.plan` prepared before calling `touchHand`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `touchHand` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
