# src/geometry/construction/AutoMovieConstructionSplitRealize.ts#AutoMovieConstructionSplitRealize

## @evidence contracts/development/implementation.md#principled-implementation

The host's ring, the chord and the rails are evaluated once and handed to every face that bounds them, as a continuation's ring and a join's rails are (`AutoMovieConstructionRing`, `AutoMovieSolidBodyMerge`), so the faces meet vertex for vertex; rollback is the realization's checkpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, band construction, then one mutation block of vertices and cycles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vertex is welded by distance and no child is kept without its sibling; a rail outside the child's domain is refused, not clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the steps, the shared vertices, the published chains and the failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in columns for vertices and cycles after both bands; the checkpoint costs O(F+C) as for a join.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each shared vertex is created once and referenced by every cycle that bounds it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains 2n ring and chord vertices, 2n rail vertices, two band faces and six cycles; the checkpoint is released when the node settles.
