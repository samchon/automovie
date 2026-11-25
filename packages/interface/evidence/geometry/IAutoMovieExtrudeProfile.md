# src/geometry/IAutoMovieExtrudeProfile.ts#IAutoMovieExtrudeProfile.IProps

## @evidence contracts/development/common.md#meaningful-documentation

A local XY metre profile and positive metre depth describe a convex prism centred on Z. The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.

## @evidence contracts/development/design.md#principled-representation

A local XY metre profile and positive metre depth describe a convex prism centred on Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

extrudeAutoMovieProfile owns hull admission and mesh creation from this input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.
