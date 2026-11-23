# src/audit/AutoMovieMotionHumanAuditMotion.ts#AutoMovieMotionHumanAuditMotion.lattice

## @evidence contracts/development/common.md#meaningful-documentation

Same lattice and endpoint rule as grid.

## @evidence contracts/development/implementation.md#principled-implementation

Computes the count of regular ticks and preserves the optional endpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each query is one indexed regular tick or the final endpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Same origin and tolerance as the materialized grid.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup and indexed access with no materialized array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both whole-grid and sparse consumers use identical sample clocks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only numeric terms.
