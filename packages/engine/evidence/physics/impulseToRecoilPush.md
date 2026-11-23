# src/physics/impulseToRecoilPush.ts#impulseToRecoilPush

## @evidence contracts/development/implementation.md#principled-implementation

Euclidean impulse magnitude multiplied by a finite nonnegative degree-per-impulse gain becomes flexion; direction is deliberately discarded by this existing scalar response policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Conversion of collision magnitude into a pose target is separate from resolveImpact's mechanics and impactRecoil's constraint projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no per-actor gain override hidden here; the caller supplies gain explicitly. Finite impulse admission is upstream, and extreme multiplication can overflow.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give gain units, nonnegative finite admission, magnitude-only flexion and thrown invalid gain.

## @evidence contracts/development/implementation.md#efficient-algorithms

One three-component norm and multiplication take O(1) time and one returned scalar record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Vector3 owns the norm formula; no push is reused across distinct impulse/gain pairs or mutable inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned push and no impact history, callback or native resource is retained.
