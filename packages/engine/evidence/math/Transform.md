# src/math/Transform.ts#Transform.identity

## @evidence contracts/development/common.md#meaningful-documentation

States the three parts and that each call returns a new record.

## @evidence contracts/development/implementation.md#principled-implementation

The neutral element of composing transforms: the zero translation, the identity rotation and the unit scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `of` with the zero translation and the identity rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the same exact value for every call, never a cached record.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three literal parts in constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh record is the contract, so sharing one would be wrong rather than cheaper.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each record owns its components and nothing is retained.

# src/math/Transform.ts#Transform.of

## @evidence contracts/development/common.md#meaningful-documentation

States each part's unit, the scale's default and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The record of its three parts, the unscaled frame's scale the identity of scaling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal from the parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parts are taken as given; the scale's positivity is the caller's premise, which the engine's transform validation checks.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One record in constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure constructor of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record; the default scale is new on each call.
