# src/geometry/curve/tessellateAutoMovieContourLoft64.ts#tessellateAutoMovieContourLoft64

## @evidence contracts/development/implementation.md#principled-implementation

The shared kernel emits original indexed millimetre positions and oriented triangles; the existing normal operator runs on those complete channels before metre publication.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This explicit memory sink retains the existing mesh result while the shared generator owns correspondence and qualification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source geometry, positional alias, alternate triangulator or changed normal reduction replaces generated coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

States the memory materialization boundary, physical conversion and unchanged qualification ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Kernel preparation and strip search dominate; materialization and normal reduction cost O(V+T+K) for vertices, triangles and construction samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One kernel invocation supplies indexed geometry, construction and actual qualification metadata.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This memory API deliberately retains complete vertex/triangle channels. Borrowed construction-point references and paid phase arrays survive until normal reduction and final construction conversion; no file or cache is acquired.
