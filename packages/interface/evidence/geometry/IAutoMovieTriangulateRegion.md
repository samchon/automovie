# src/geometry/IAutoMovieTriangulateRegion.ts#IAutoMovieTriangulateRegion.IProps

## @evidence contracts/development/design.md#principled-representation

All contours use one local x/y metre frame, with closure implicit and either winding accepted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

triangulateAutoMovieRegion delegates to the shared region hygiene, canonical winding and ear-clipping owners used by extrusion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Malformed, intersecting or touching rings and invalid hole containment refuse; numerical bridge or ear-search failure also throws instead of returning repaired geometry.

## @evidence contracts/development/common.md#meaningful-documentation

The outer contour and optional voids of an authored planar region. All contours use one local x/y metre frame, with closure implicit and either winding accepted.
