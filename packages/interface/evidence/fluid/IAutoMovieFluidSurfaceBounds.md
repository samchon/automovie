# src/fluid/IAutoMovieFluidSurfaceBounds.ts#IAutoMovieFluidSurfaceBounds

## @evidence contracts/development/design.md#principled-representation

fluidSurfaceGeometry takes per-axis minima/maxima over triangle-referenced numerical positions. For finite positions this is their exact axis-aligned hull; the producer has no separate finite-result check for extreme derived positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two corners are the whole box; it exists only inside the nullable `IAutoMovieFluidSurface.bounds`, so an empty surface has no box instead of an infinite or inverted one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unreferenced dry cells do not enlarge this box. A sphere derived from the box may include drained or otherwise empty surrounding space; neither this record nor that sphere proves wet coverage or pixel equality.

## @evidence contracts/development/common.md#meaningful-documentation

States world metre units, indexed numerical membership, finite-position premise and the difference between this hull, a derived enclosing sphere and GPU projection; members identify each corner.
