# src/geometry/IAutoMoviePlanarRegion.ts#IAutoMoviePlanarRegion

## @evidence contracts/development/common.md#meaningful-documentation

One authored outer contour with optional holes in a common local XY metre frame.

## @evidence contracts/development/design.md#principled-representation

The planar admission path examines ring edges and hole containment, then canonicalizes winding for shared triangulation and extrusion consumers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The region borrows authored coordinates and ring structure. Triangulation indices and normalized winding belong to the generated result.

# src/geometry/IAutoMoviePlanarRegion.ts#IAutoMoviePlanarRegion.outer

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed simple outer ring with at least three finite XY points. Supply no repeated closing vertex because closure is implicit.

# src/geometry/IAutoMoviePlanarRegion.ts#IAutoMoviePlanarRegion.holes

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed hole rings in declaration order, disjoint and strictly within the outer ring. Omission or an empty list describes no voids.
