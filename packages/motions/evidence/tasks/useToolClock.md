# src/tasks/useToolClock.ts#useToolClock

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `useTool.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The reach and the return take the timing owner's movement time; each cycle is a hammer's, a saw's or a screwdriver's measured or provisional period (`useTool.PERIODS`), or a stir's circle at the measured stroke speed (`useTool.STROKE_SPEED`), halved at its contact; the manner scales the whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `useTool.plan`: its clock, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `useTool.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `useTool.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `useTool.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/tasks/useToolClock.ts#useToolClock.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `useTool.plan` prepared before calling `useToolClock`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useToolClock` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
