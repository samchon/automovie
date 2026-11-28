# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Packed triangle geometry and finite positive reach for a mesh in object-space metres.

## @evidence contracts/development/design.md#principled-representation

The edge census checks complete triples, finite coordinates and safe in-range ordinals before building incidence on exactly matching positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input exposes only geometry and a distance cutoff. A skinned consumer supplies bind-pose positions.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IProps.positions

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed finite packed XYZ positions in metres with three coordinates per vertex. Exact coordinate equality welds vertices.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IProps.indices

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed zero-based safe in-range vertex ordinals in groups of three. Zero-area triangles contribute no feature-edge incidence.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IProps.reach

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite retention distance in metres. A segment at exactly this distance remains eligible for a triangle list.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Feature segment table and bounded edge lists keyed by original triangle ordinal.

## @evidence contracts/development/design.md#principled-representation

The operation keeps edges with two distinct-face uses whose normal angle exceeds 30 degrees. It orders up to sixteen nearby edge ordinals by triangle-to-segment distance and breaks ties by ordinal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The receipt shares one endpoint table across triangles and carries its measurement reach. The source geometry stays with its owner.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IResult.edges

## @evidence contracts/development/common.md#meaningful-documentation

Measured segments in first-contributing-triangle and side order. Boundary edges and edges with more than two uses are excluded.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IResult.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Per-source-triangle lists of at most sixteen edge ordinals, nearest first, with segment ordinal breaking ties. The outer array retains degenerate source triangles' slots.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IResult.reach

## @evidence contracts/development/common.md#meaningful-documentation

The supplied reach in metres, reused as the distance cap by the CPU and shader readers.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

One oriented pair of mesh feature endpoints and its convex or concave classification.

## @evidence contracts/development/design.md#principled-representation

The first using triangle's side order determines endpoint placement, and the second face's centroid relative to the first face's normal determines sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The segment carries metre endpoints and one sign for shading. Source triangles and face normals remain measurement work data.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IEdge.a

## @evidence contracts/development/common.md#meaningful-documentation

Object-space metre position of the first endpoint in the first contributing triangle's side order.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IEdge.b

## @evidence contracts/development/common.md#meaningful-documentation

Object-space metre position of the second endpoint in the first contributing triangle's side order.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IEdge.convex

## @evidence contracts/development/common.md#meaningful-documentation

True when the second face's centroid lies behind the first face along the first face normal's opposite direction. Other admitted bends are concave.
