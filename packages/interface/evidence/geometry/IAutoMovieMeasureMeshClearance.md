# src/geometry/IAutoMovieMeasureMeshClearance.ts#IAutoMovieMeasureMeshClearance.IResult

## @evidence contracts/development/design.md#principled-representation

Triangle is an original front-triangle ordinal; minimum is front-minus-back depth in the meshes' common metre frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieMeshClearance supplies directional ordering queries and minimizeAutoMovieMeshClearance constraints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The measurement validates buffers, axis and arithmetic; it skips axial projections of zero area and omits triangles with no overlap, so this is not a volume collision test.

## @evidence contracts/development/common.md#meaningful-documentation

Minimum directional depth separation for each overlapping front triangle. Triangle is an original front-triangle ordinal; minimum is front-minus-back depth in the meshes' common metre frame.
