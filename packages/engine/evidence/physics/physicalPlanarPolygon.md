# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon

## @evidence contracts/development/common.md#meaningful-documentation

States whose semantics the helpers keep, the frame's axes and how world points map in and out.

## @evidence contracts/development/design.md#principled-representation

Points of a horizontal frame, x forward and y left with z up as IHMC's sole frames, metres; polygons are clockwise vertex lists, as Euclid's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the capture region, the footstep adjustor, the push recovery, the foot switch and the capture-point controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members or casts; clockwise order is a documented invariant the hull establishes.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

Documents both axes.

## @evidence contracts/development/design.md#principled-representation

A point of the frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used throughout the ported modules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members required.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Documents the origin and the unit forward direction.

## @evidence contracts/development/design.md#principled-representation

A floor frame in the engine's y-up world: origin and forward in world x and z; left is up x forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `local` and `world`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members required; the forward direction's unit length is checked by no one, stated for the caller.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.local

## @evidence contracts/development/common.md#meaningful-documentation

States the projection onto forward and left.

## @evidence contracts/development/implementation.md#principled-implementation

Two dot products with forward and left = (forward.z, -forward.x), a rotation, so distances and orientation are kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It maps one point.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.world

## @evidence contracts/development/common.md#meaningful-documentation

States that it inverts `local`.

## @evidence contracts/development/implementation.md#principled-implementation

The transposed rotation plus the origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It maps one point.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.hull

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the duplicate tolerance and the degenerate results.

## @evidence contracts/development/implementation.md#principled-implementation

Andrew's monotone chain finds the vertices Euclid's gift wrapping keeps, collinear ones dropped; it runs counter-clockwise and is reversed to Euclid's clockwise. The starting vertex differs from Euclid's, which no ported caller reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sort, deduplicate, two chains, reverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts; non-null assertions read the chain's last two points while it has them.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n log n) for the sort; the duplicate test is O(n^2) over the few points of a foot or region.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one hull.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.area

## @evidence contracts/development/common.md#meaningful-documentation

States the degenerate values.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `computeConvexPolygon2DArea`: not a number for no vertex, zero under three, the shoelace sum otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two guards and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.centroid

## @evidence contracts/development/common.md#meaningful-documentation

States the degenerate values and that it is the area centroid.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's centroid from the same sum: the vertices' mean under three vertices, the area centroid otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two guards and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.visible

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the listed vertices and when there are none.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `computeVisibleVerticesFromOutsideLeftToRightCopy` over Euclid's `lineOfSightStartIndex` and `lineOfSightEndIndex`: from the end vertex back to the start, with Euclid's cases for one and two vertices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The line of sight, then one walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read vertices by index within the polygon.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.inside

## @evidence contracts/development/common.md#meaningful-documentation

States that the boundary is inside and the degenerate cases.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `isPoint2DInsideConvexPolygon2D` with no epsilon: no edge sees the point strictly from outside.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Guards, then one loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.signedDistance

## @evidence contracts/development/common.md#meaningful-documentation

States the sign and the not-a-number point.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's signed distance: the distance to the nearest edge, negated inside.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Guards, the boundary distance and the sign.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.project

## @evidence contracts/development/common.md#meaningful-documentation

States the inside and outside cases.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `orthogonalProjection`: an inside point stays, an outside one goes to the nearest boundary point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guard and one boundary search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.intersect

## @evidence contracts/development/common.md#meaningful-documentation

States the method, the result's order and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

Sutherland and Hodgman's clipping of one convex polygon by the other's edges gives the same point set as IHMC's `ConvexPolygonTools.computeIntersectionOfPolygons`; a polygon of one or two vertices keeps those of its points inside the other.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Degenerate cases, then one clip per edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read vertices by index within their polygons.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n m) for n and m vertices, a hull per clip.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads two polygons.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.scale

## @evidence contracts/development/common.md#meaningful-documentation

States the map.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `ConvexPolygon2D.scale(Point2D, double)`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It maps one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.shrink

## @evidence contracts/development/common.md#meaningful-documentation

States the polygon, segment and point cases, the collapse and the distance's domain.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `ConvexPolygonScaler.scaleConvexPolygon` (l.75-190): each edge's line moved in by the distance and the region inside them all kept, which for an inward distance is the polygon clipped by the moved lines; an empty region collapses to the area centroid. Segments and points follow l.82-126. Growth, a negative distance, is not ported: no caller uses it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The degenerate cases, then one clip per edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read vertices by index within the polygon.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n^2) for n vertices, a hull per clip.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPlanarPolygon.ts#physicalPlanarPolygon.rows

## @evidence contracts/development/common.md#meaningful-documentation

States the rows for each vertex count and the end caps' inset.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `PolygonWiggler.convertToInequalityConstraints` (l.287-420): an edge's left unit normal for a clockwise polygon, the line and its caps for a segment, a box for a point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per vertex count.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read vertices by index within the polygon.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one polygon.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
