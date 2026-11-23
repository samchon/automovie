# src/geometry/boundAutoMovieTriangleAttachmentContact.ts#boundAutoMovieTriangleAttachmentContact

## @evidence contracts/development/implementation.md#principled-implementation

Barycentric slab argument: along the support's direction every contact point lies inside the support slab, and a fan point's height is the barycentric blend of root and corner heights, so its non-root weight w satisfies w*s <= (1-w)*delta; every subtraction, division and L1 sum is rounded outward so the cap encloses the exact bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Projection enclosure is delegated to `measureAutoMovieProjectionIntervals`; this function only forms the slab quantities and the cap, while seat validation and the strict test of other triangles stay in the separation query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cap covers every point of the complete fan rather than a nearest witness, a degenerate support or nonpositive corner gap reports an unproved zero cap instead of a guessed one, and the support's edges are scaled by their largest component only to keep the cross product finite.

## @evidence contracts/development/common.md#meaningful-documentation

States what each vertex is, what the caller must already have proved, the slab construction and its formula, when the proof fails, what it does not assert, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one cross product, one six-point projection and two three-axis L1 sums.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function evaluated once per attachment support by each separation call; the caller keeps the resulting caps.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns an owned four-field record and keeps no reference to either triangle.
