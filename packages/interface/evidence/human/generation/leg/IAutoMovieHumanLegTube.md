# src/human/generation/leg/IAutoMovieHumanLegTube.ts#IAutoMovieHumanLegTube

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegTube exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISection, IInput, OfResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegTube; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISection, IInput, OfResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegTube.ts#IAutoMovieHumanLegTube.ISection

## @evidence contracts/development/common.md#meaningful-documentation

One station's section.

## @evidence contracts/development/design.md#principled-representation `scale`: The scale from the unit shape to millimetres. `girth`: The taut girth of the section, mm. `points`: The 264 knot points `[x, z]`, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegTube.of. Read by AutoMovieHumanLegSectionLaw.radii. Also types AutoMovieHumanLegSectionLaw.tube.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `scale`, `girth`, `points`, `controls`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegTube.ts#IAutoMovieHumanLegTube.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the tube is placed from.

## @evidence contracts/development/design.md#principled-representation `bones`: The joints' heights, which place the landmark rows. `girth`: The girth the section asks for at a station, mm. `reliefs`: The reliefs, their windows on the chart (station in mm, phase in radians) and their axes in the section frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegTube.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `ends`: The neighbours' rings as the shape's first and last rows.

# src/human/generation/leg/IAutoMovieHumanLegTube.ts#IAutoMovieHumanLegTube.OfResult

## @evidence contracts/development/common.md#meaningful-documentation

The tube.

## @evidence contracts/development/design.md#principled-representation

The tube. The callable takes s and returns ISection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegTube.OfResult is the canonical exchange used by AutoMovieHumanLegTube.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegTube.of for the tube.
