# src/human/generation/IAutoMovieHumanBodyStrip.ts#IAutoMovieHumanBodyStrip.IColumn

## @evidence contracts/development/common.md#meaningful-documentation

Both edges of one column: points and outward arc-length derivatives.

## @evidence contracts/development/design.md#principled-representation `A`: Appendage end point. `a1`: Appendage's unit tangent leaving its end, into the strip. `a2`: Appendage's curvature vector there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyStrip.column. Read by AutoMovieHumanBodyStrip.blend. Also types AutoMovieHumanBodyStrip.c, AutoMovieHumanBodyStrip.before.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `A`, `a1`, `a2`, `C`, `c1`, `c2`, `l`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyStrip.ts#IAutoMovieHumanBodyStrip.AcrossResult

## @evidence contracts/development/common.md#meaningful-documentation

First and second arclength derivatives across a chain at the requested chart point, in the chain's world frame. The first is dimensionless; the second has inverse-millimetre units. The owning operation uses the available chain jet or its documented finite-difference estimate.

## @evidence contracts/development/design.md#principled-representation

First and second arclength derivatives across a chain at the requested chart point, in the chain's world frame. The first is dimensionless; the second has inverse-millimetre units. The owning operation uses the available chain jet or its documented finite-difference estimate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyStrip.AcrossResult is the canonical exchange used by AutoMovieHumanBodyStrip.across.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanBodyStrip input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
