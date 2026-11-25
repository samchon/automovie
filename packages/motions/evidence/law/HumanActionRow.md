# src/law/HumanActionRow.ts#HumanActionRow

## @evidence contracts/development/common.md#meaningful-documentation

States the three inputs and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The fixed parameters override the given ones, then pass through the owner's own `resolve`, so a row of a row resolves to the first owner's parameters and family.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record built from the owner's members.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Optional members are copied only when the owner declares them.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to cache: the record is built once per row.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the owner and the fixed parameters for as long as the row is held.
