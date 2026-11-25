# src/executable/cases/locomotionCaseInstants.ts#locomotionCaseInstants

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes for `locomotionCase` and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The same computation `locomotionCase` made in place, moved unchanged to its own file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `locomotionCase`, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `locomotionCase`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `locomotionCase` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads what `locomotionCase` reads instead of computing it again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as its caller holds it.