# src/geometry/IAutoMovieExtrudeRegion.ts#IAutoMovieExtrudeRegion.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Local XY metre rings and metre depth define a region extruded symmetrically along Z. Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.

## @evidence contracts/development/design.md#principled-representation

Local XY metre rings and metre depth define a region extruded symmetrically along Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

extrudeAutoMovieRegion consumes the outer ring, optional holes and depth through the shared triangulator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.
