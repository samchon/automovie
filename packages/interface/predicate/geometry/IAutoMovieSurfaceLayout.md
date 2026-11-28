# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout

## @evidence contracts/development/common.md#meaningful-documentation

Mutable cage layout writer with vertex quads, UV buffers and one normalized chart per face corner.

## @evidence contracts/development/design.md#principled-representation

Grid emission appends quads in row and column order. Non-grid emission reads explicit chart coordinates and shares texture coordinates within the patch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The writer owns its accumulated layout and appends caller-provided vertex identities. Surface sampling owns the vertex positions.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.faces

## @evidence contracts/development/common.md#meaningful-documentation

Accumulated quads of zero-based cage vertex ordinals in the patch's counterclockwise chart order.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.uvs

## @evidence contracts/development/common.md#meaningful-documentation

Packed UV pairs generated from each patch texture rectangle or its default band of the unit square.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.uvFaces

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based UV pair ordinals in the same face and corner order as faces.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.corners

## @evidence contracts/development/common.md#meaningful-documentation

Parallel patch addresses for each face's four corners, indexed by face and local corner.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.grids

## @evidence contracts/development/common.md#meaningful-documentation

One accumulated patch layout at each emitted network patch ordinal, carrying that patch's original name and face list.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.emit

## @evidence contracts/development/common.md#meaningful-documentation

Append one regular patch as row-major quads, with s across columns and t across rows.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.emitFaces

## @evidence contracts/development/common.md#meaningful-documentation

Append explicit charted quads for a non-grid patch, preserving input face and corner order.

# src/geometry/IAutoMovieSurfaceLayout.ts#IAutoMovieSurfaceLayout.check

## @evidence contracts/development/common.md#meaningful-documentation

Throw when an ordered cage edge occurs more than once in the accumulated faces.
