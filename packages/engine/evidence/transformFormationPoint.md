# src/transformFormationPoint.ts#transformFormationPoint

## @evidence contracts/development/implementation.md#principled-implementation

The XZ offset is rotated into base-facing coordinates, scaled laterally and in depth, then rotated by base plus cue facing and translated; Y receives translation only, under admitted finite and representable scalar arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point transform defines the affine spacing/facing rule used by formation bounds, production placement and validation callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored base frame is preserved rather than scaling world axes; no vertical spacing scale, admission clamp or malformed-state fallback is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world point/anchor coordinates, degree angles, dimensionless lateral/depth scales and fresh output; extreme finite products may still be unrepresentable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each point takes constant trigonometric/scalar work and one fresh vector; bounds callers pay this cost for each of eight corners.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumers share this canonical transform, but per-call angles are recomputed and no pose result is retained across mutable motion inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh vector; input point, anchor and state are not retained and no host resources are acquired.
