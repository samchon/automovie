# src/geometry/placeAutoMovieSurfaceFrame.ts#placeAutoMovieSurfaceFrame

## @evidence contracts/development/implementation.md#principled-implementation

Recombines prepared metre coordinates with one right-handed orthonormal destination basis and translation, the rigid change of frame that preserves triangle edge lengths up to rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement consumes source preparation and the shared frame normalizer without loading a mesh, interpreting bones or choosing a support policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Target vector lengths never resize the sample; zero/parallel directions and nonfinite represented output refuse instead of producing fitted or fabricated points.

## @evidence contracts/development/common.md#meaningful-documentation

States centroid placement, normal priority, source order, numerical precision, borrowed/fresh ownership, refusals and the distinction from whole-body support or reachability.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame construction and three fixed-size point mappings cost constant time and scratch, with no work proportional to mesh vertices or skeleton bones.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared frozen source offsets for each destination; mutable destination values are normalized afresh and effect-free results are returned independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers exactly three fresh points to the caller and retains no destination, prepared sample, native handle or placement history.
