# src/physics/physicalHullSegment.ts#physicalHullSegment

## @evidence contracts/development/common.md#meaningful-documentation

States both cases, the method of each, the parameter's meaning, the frame and the grazing case.

## @evidence contracts/development/implementation.md#principled-implementation

The distance of two convex polytopes by Gilbert, Johnson and Keerthi (IEEE J Robot Autom 4:193, 1988) with the nearest point of a simplex by Voronoi region tests (Ericson, Real-Time Collision Detection, sections 5.1.5 and 5.1.6), and the deepest point as the one-variable linear program min over t of max over faces, solved by walking its upper envelope; both are exact for polytopes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of segment-to-hull proximity; `physicalShapeNearest` reads the point, normal and distance at this parameter from `physicalHullNearest`, the single owner of the point query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The only tolerance is the hull's own coplanarity tolerance, which separates a meeting from a gap; the iteration bound is the count of distinct support pairs, which the strictly shrinking nearest point cannot revisit. The non-null assertions index the simplex and the faces by bounded indices.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few support scans over the hull's vertices apart, and one pass over the faces per envelope piece within, in place of the 47 point queries of a golden-section search.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the hull and the segment; the faces and vertices it reads are shared by `physicalHullFaces`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; its temporaries die with the call.
