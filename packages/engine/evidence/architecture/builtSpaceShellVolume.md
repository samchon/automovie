# src/architecture/builtSpaceShellVolume.ts#builtSpaceShellVolume

## @evidence contracts/development/implementation.md#principled-implementation

Uses one sixth of the binary64 sum of `a · (b × c)`. The divergence-theorem volume and origin independence require a closed, consistently oriented shell with suitable finite intermediates. Validation checks local edge pairing and positive aggregate computed volume; it does not prove every component's orientation or exclude all self-intersections.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One accumulation loop over the index triples, with voids handled by winding rather than by a separate record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no shell; a missing vertex is skipped rather than guessed, and the documentation says validation refuses that record before this runs.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the unit, how voids and inward winding read, what is skipped, and which caller answers for fidelity.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the triangle indices with constant extra space, linear in the triangle count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure sum over one shell value that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond scalars and retains nothing.
