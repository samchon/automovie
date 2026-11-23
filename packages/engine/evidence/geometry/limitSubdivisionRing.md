# src/geometry/limitSubdivisionRing.ts#limitSubdivisionRing

## @evidence contracts/development/implementation.md#principled-implementation

Smooth limit and tangent masks are left eigenvectors of the Catmull-Clark subdivision matrix (Halstead, Kass and DeRose 1993), and darts and three-face crease sides use the eigenvectors of their own matrices; the crease limit is the cubic B-spline curve point; a two-face crease side is a regular B-spline boundary; corner tangents are the end tangents of the crease curves. Crease sides of one or four or more faces use OpenSubdiv's masks, stated as approximations together with the eigenstructure reason no exact normal exists there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function per vertex class decision, with sectors found from the sharp edges in fan order so crease and corner vertices share one sector bookkeeping; the dart eigenvectors are computed in their own function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A valence-two interior vertex and a vanishing or non-finite normal are refused instead of replaced; the only fallback is the stated collinear corner sector, which has no curve-determined tangent plane.

## @evidence contracts/development/common.md#meaningful-documentation

States the precondition, each class's limit and normal rule with sources, which results are exact and which approximate and why, the corner orientation and its degenerate case, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the valence for every class except darts and three-face crease sides, whose eigenvector search is quadratic in the ring size per iteration.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each ring is evaluated once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns small arrays sized by the valence and retains nothing.
