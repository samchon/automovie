# src/math/swingTwist.ts#swingTwist

## @evidence contracts/development/implementation.md#principled-implementation

The projection form of the swing-twist decomposition (Dobrowolski 2015); projected quaternion lengths below 1e-12 use the identity-twist convention, including numerically near-degenerate nonzero projections.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of swing-twist in the engine: `splitDistalTwist` and the hinged-chain candidate's effector error both call it instead of projecting inline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The explicit 1e-12 near-degeneracy threshold avoids normalizing a tiny projection; it changes those results to the documented convention and does not claim an exact degeneracy predicate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one projection, one normalisation and one quaternion product.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two small values; there is nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fresh quaternions and keeps nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the factor order, the method and its source, and the degenerate half-turn case with the value returned.
