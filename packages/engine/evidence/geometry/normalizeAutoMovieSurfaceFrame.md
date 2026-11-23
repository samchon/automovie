# src/geometry/normalizeAutoMovieSurfaceFrame.ts#normalizeAutoMovieSurfaceFrame

## @evidence contracts/development/implementation.md#principled-implementation

Normalizing each finite direction before crossing avoids input-magnitude overflow; the two cross products produce the normal-priority orthonormal basis in the existing sweep-frame representation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation, placement and public geometry alignment share one basis admission owner, reusing Vector3 algebra and the already public IAutoMovieSurfaceFrame/IAutoMovieSweepFrame contracts rather than another matrix or quaternion convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero directions and exact represented parallelism refuse rather than choosing a world axis; no fixture tolerance conceals ill-conditioned inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States metre origin, direction magnitude independence, projected x and right-handed y, normal priority, fresh mutable output ownership, every refusal, binary64 conditioning and the distinction from contact/support admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three finite-vector checks, normalizations and two cross products take constant time and constant scratch, independent of any mesh population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Preparation, placement and measured geometry alignment use this same basis law; current mutable request values are read afresh and no cross-call result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh origin and basis records transfer to the caller; temporary normalized directions expire on return and no input or task is retained.
