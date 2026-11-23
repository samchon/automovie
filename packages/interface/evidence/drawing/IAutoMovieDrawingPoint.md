# src/drawing/IAutoMovieDrawingPoint.ts#IAutoMovieDrawingPoint

## @evidence contracts/development/design.md#principled-representation

Projection subtracts frame origin and takes two axis dot products; stored points then use round(value*1e6)/1e6 with negative zero normalized. Six-decimal output is a numerical convention, not exact decimal arithmetic: projection/rounding can overflow and distinct nearby world points can merge, while a returned page point has lost normal depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Page coordinates stay in model metres so lengths and areas read off the page are model measurements, and scale belongs to the serializer alone, which keeps one drawing valid at every print scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No coordinate is shifted, clamped or flipped for a consumer here; the SVG flip and margin happen only in the serializer's own placement.

## @evidence contracts/development/common.md#meaningful-documentation

States the metre unit, the axes and origin, the upward `y`, the rounding and `-0` rule, and where scale and the SVG flip are applied.
