# src/perform/launchPropProjectile.ts#launchPropProjectile

## @evidence contracts/development/common.md#meaningful-documentation

Identifies request, world frame, optional controls and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Offsets the release origin by the rotated spherical centre and solves a supplied elapsed-time aim under standard uniform gravity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates optional shape and aim, then constructs the initial state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses invalid sphere parameters, rotating sphere attitudes and aims under drag; an un-aimed release uses the authored velocity.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar and vector operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the engine gravity, quaternion and vector owners and returns the standard projectile consumed by the same sampler and collision resolver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one value and retains no resources.
