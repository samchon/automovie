# src/geometry/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps

## @evidence contracts/development/common.md#meaningful-documentation

One sampled network cage and its incident-face queries in requested vertex order.

## @evidence contracts/development/design.md#principled-representation

The locator bilinearly blends quad chart coordinates, then maps t and s into the selected sweep or transition patch's u and v ranges.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input borrows topology and charts once for each tier and level. The output addresses can be reused across poses.

# src/geometry/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps.network

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed network whose patch count and ordered names must match the sampled cage. Its patches supply sweep domain ranges.

# src/geometry/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps.cage

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed cage with valid chart coordinates at every addressed quad corner. The lookup reads chart data independently of geometry positions.

# src/geometry/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps.parameters

## @evidence contracts/development/common.md#meaningful-documentation

Dense incident-face address sequence in output order, with an existing quad, null corner and finite u and v in [0, 1] for each point.
