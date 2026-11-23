# src/index.ts#to2

## @evidence contracts/development/implementation.md#principled-implementation

Dot products against the plane axes project a displacement into physical in-plane coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The documented normal residual is deliberately discarded instead of silently moving the source plane.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.

## @evidence contracts/development/common.md#meaningful-documentation

States the operation, physical interpretation and its documented degeneracy or ownership limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call depends directly on its arguments; no retained cache or effectful shared work exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one coordinate pair and retains no state.
