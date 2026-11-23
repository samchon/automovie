# src/geometry/IAutoMovieBuildRegionFace.ts#IAutoMovieBuildRegionFace.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Local XY metre rings define one +Z-facing planar region with optional voids. Optional holes mean an unperforated region when absent; this contract promises neither thickness nor automatic ring repair.

## @evidence contracts/development/design.md#principled-representation

Local XY metre rings define one +Z-facing planar region with optional voids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

buildAutoMovieRegionFace consumes IProps and delegates ring admission to triangulateAutoMovieRegion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional holes mean an unperforated region when absent; this contract promises neither thickness nor automatic ring repair.
