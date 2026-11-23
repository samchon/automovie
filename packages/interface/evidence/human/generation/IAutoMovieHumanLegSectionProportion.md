# src/human/generation/IAutoMovieHumanLegSectionProportion.ts#IAutoMovieHumanLegSectionProportion

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegSectionProportion exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IRow, IAtResult, IBoxResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegSectionProportion; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IRow, IAtResult, IBoxResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanLegSectionProportion.ts#IAutoMovieHumanLegSectionProportion.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One share's breadth over depth and fullness, means over the eight legs.

## @evidence contracts/development/design.md#principled-representation `share`: Share of the ankle-to-crotch span. `ratio`: Breadth (lateral) over depth (front to back). `fullness`: The girth's place in its box range, 0 the rhombus, 1 the box.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegSectionProportion.ROWS, AutoMovieHumanLegSectionProportion.first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `share`, `ratio`, `fullness`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegSectionProportion.ts#IAutoMovieHumanLegSectionProportion.IAtResult

## @evidence contracts/development/common.md#meaningful-documentation

The ratio and fullness at a share, linear between the rows and held beyond the ends.

## @evidence contracts/development/design.md#principled-representation `ratio`: Section breadth divided by depth, dimensionless. `fullness`: Dimensionless position of girth between the section's rhombus perimeter (0) and box perimeter (1).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSectionProportion.IAtResult is the canonical exchange used by AutoMovieHumanLegSectionProportion.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ratio`, `fullness`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegSectionProportion.ts#IAutoMovieHumanLegSectionProportion.IBoxResult

## @evidence contracts/development/common.md#meaningful-documentation

The breadth and depth of a section of girth G at a share.

## @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSectionProportion.IBoxResult is the canonical exchange used by AutoMovieHumanLegSectionProportion.box.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`; callers supply the complete record.
