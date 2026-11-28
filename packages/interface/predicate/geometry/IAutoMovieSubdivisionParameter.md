# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter

## @evidence contracts/development/common.md#meaningful-documentation

The address documents quad chart orientation, the nonquad corner subcharts and the representative chosen for shared vertices.

## @evidence contracts/development/design.md#principled-representation

Admission seeds each quad with unit-square corners and each nonquad corner with its local origin. Refinement propagates those addresses and final evaluation selects the first incident corner per vertex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The value identifies one source parameterization independent of current render topology. Adjacent chart addresses stay in the level's corner buffers.

# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter.face

## @evidence contracts/development/common.md#meaningful-documentation

The ordinal addresses a polygon in the original authored cage.

# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter.corner

## @evidence contracts/development/common.md#meaningful-documentation

Null selects a quad's single chart. Other values identify the source polygon corner whose subchart contains the vertex.

# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter.u

## @evidence contracts/development/common.md#meaningful-documentation

The first normalized coordinate follows the source chart's defined corner direction.

# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter.v

## @evidence contracts/development/common.md#meaningful-documentation

The second normalized coordinate follows the other direction of the same chart.
