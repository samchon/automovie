# src/human/generation/IAutoMovieHumanBodySurfaceNormals.ts#IAutoMovieHumanBodySurfaceNormals.IStationJet

## @evidence contracts/development/common.md#meaningful-documentation

A chain's sections at a station and its two difference neighbours.

## @evidence contracts/development/design.md#principled-representation `here`: Actual world value/phase tangent plan, independent of physical station2. `lo`: The station STEP mm below, clamped into the chain. `hi`: The station STEP mm above, clamped into the chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodySurfaceNormals.stationJet. Also types AutoMovieHumanBodySurfaceNormals.cache, AutoMovieHumanBodySurfaceNormals.stations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `here`, `lo`, `hi`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodySurfaceNormals.ts#IAutoMovieHumanBodySurfaceNormals.IStationSample

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned actual world value plan of one station.

## @evidence contracts/development/design.md#principled-representation `at`: Actual world point reader retained by this normal calculation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodySurfaceNormals.place. Also types AutoMovieHumanBodySurfaceNormals.sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`; callers supply the complete record.
