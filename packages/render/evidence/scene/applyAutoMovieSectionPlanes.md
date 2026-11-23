# src/index.ts#applyAutoMovieSectionPlanes

## @evidence contracts/development/implementation.md#principled-implementation

Negates each authored removal-halfspace normal and normalizes it into a Three world-space plane through the same point; admitted normals must be finite/nonzero. clipIntersection=false applies every removal plane, while ideal zero-distance inclusion does not certify shader precision or alpha-to-coverage boundary pixels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assigns one shared plane array to existing materials and toggles renderer local clipping without replacing geometry/materials; this inspection owner replaces previous clipping policy rather than editing production assets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses authored plane geometry uniformly with no object-name exceptions or replacement Three methods; renderer/material fields use supported clipping APIs and no solver geometry is manufactured for the cut.

## @evidence contracts/development/common.md#meaningful-documentation

Describes world-plane orientation, any-plane removal, ideal versus rendered boundaries, empty-list clearing and plane-count needsUpdate requests; prior policy restoration, pixel equality and actual compile counts are not claimed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds P planes and traverses O scene objects plus all encountered material slots, assigning one shared array rather than cloning P planes per material; repeated shared materials may receive repeated inexpensive assignments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All material slots share the built planes for this call. Value-only movement can reuse a program when plane/intersection counts and other program inputs remain unchanged; Three controls that reuse, while current scene and plane values prevent a retained root-only result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows root/renderer/materials and transfers P plane references to materials and the caller; next assignment/empty release removes those references, with no geometry/GPU allocation, observer or task owned here.
