# src/construction/IAutoMovieConstructionProfileLoop.ts#IAutoMovieConstructionProfileLoop

## @evidence contracts/development/design.md#principled-representation

A closed component retains original piece order, winding, physical station bounds and explicit endpoint collapse.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Profile preparation and meshing use the same contour record for outer components and holes without imposing convexity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Planar winding and surface normal orientation are distinct; coincident loops are not automatically sewn.

## @evidence contracts/development/common.md#meaningful-documentation

Defines piece order, station units, both orientation conventions and absent pole/default surface orientation.
