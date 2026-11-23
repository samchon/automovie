# src/construction/IAutoMovieConstructionOutline.ts#IAutoMovieConstructionOutline

## @evidence contracts/development/design.md#principled-representation

The default natural spline is C2 and least bending in its selected parameter. Authored shared value/first/second knot jets define C2 quintic spans; an explicit range uses the documented sufficient control-hull filter. Station jets can be singular at a parameter endpoint and radial zero closure is separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One knot list type serves every curve along a part, its meaning set by the field that holds it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No knot is fitted to a specimen; a knot list that is not strictly increasing is refused, never sorted or merged.

## @evidence contracts/development/common.md#meaningful-documentation

States source parameter, scalar meanings, separate radial zero closure, nonzero world endpoints and parameter-tangent extension.
