# src/perform/resolveTargetPoint.ts#resolveTargetPoint

## @evidence contracts/development/implementation.md#principled-implementation

Resolves identities through the supplied placement tables and computes an equal-weight running centroid using convex combinations, avoiding overflow from summing many finite coordinates; admitted target shapes and finite world vectors are premises, and ordinary floating rounding remains in the mean.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only staged point resolution for the actor synthesizer and film gates; bones and relative targets return null because their live rig or camera context belongs to those callers, while group membership is resolved completely before a centroid can be returned.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor or formation is special-cased and no absent member is filtered out; the same missing lookup makes a singleton or mixed group unresolved instead of changing its centre to a surviving subset.

## @evidence contracts/development/common.md#meaningful-documentation

States the world frame and unit, per-kind result and aliasing, equal member weights, empty and missing-member outcomes, the finite-shape precondition and the extra context needed for relative or live targets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Node and point resolution take constant work; a group visits each named node and formation once through map lookups with constant temporary space and exits on its first absent member, without allocating intermediate member arrays.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller supplies current placement maps for one target read; no result is reused across mutable scenes or instants, and no geometry or effectful work is coordinated here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Owns only one local centroid vector and count during a group read; node and point answers retain no new storage, and the caller owns the fresh centroid after return.
