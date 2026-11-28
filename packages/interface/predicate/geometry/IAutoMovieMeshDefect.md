# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect

## @evidence contracts/development/common.md#meaningful-documentation

Located defect carrying the original vertices of one edge or one triangle in the measured buffer.

## @evidence contracts/development/design.md#principled-representation

The measurement classifies welded incidence and stored-triangle aspect, then reports the carrying source corners in first-use order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The defect owns its classification and source references. Coordinates and weld maps stay with the measured mesh and operation.

# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect.kind

## @evidence contracts/development/common.md#meaningful-documentation

Edge or triangle class assigned by the defect census. The class determines the length and interpretation of vertices.

# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Original vertex ordinals before welding. Edge classes preserve first traversed endpoint order, and triangle classes preserve all three stored corners.

# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Defect category distinguishing an open, inconsistent or nonmanifold edge from a collapsed or sliver triangle.

## @evidence contracts/development/design.md#principled-representation

Exactly one, exactly two equally directed, and more than two edge uses produce distinct incidence categories. Triangle categories use lattice identity and optional stored-position aspect.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One category discriminates the location shape without storing edge use counts or repeating the carrying geometry.
