# src/internal/composeLocalTransform.ts#composeLocalTransform

## @evidence contracts/development/implementation.md#principled-implementation

Translation applies parent scale, unit-quaternion rotation through `v + w t + q x t` with `t = 2 q x v`, then offset; rotation uses the Hamilton product and scale is component-wise. In real arithmetic this represents the affine product when parent scale commutes with child rotation; binary64 rounding remains, and other products discard shear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Humanoid import and motion adoption share one composition function, with callers responsible for the unit-quaternion premise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fixed scalar arithmetic permits exact recomputation of an inspected basis within this pipeline; it neither normalizes quaternions nor repairs shear or non-finite inputs.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why helpers are folded, the formula, when it is exact and what it drops, the unit-rotation premise, and that fixed arithmetic order makes exact comparison reproducible.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar arithmetic allocates one transform with three component records and no intermediate vectors, independent of rig size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time pure function has nothing worth caching; callers fold each helper once per bone.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function retains nothing; its single result object belongs to the caller.
