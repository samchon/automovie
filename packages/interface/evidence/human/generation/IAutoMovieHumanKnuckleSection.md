# src/human/generation/IAutoMovieHumanKnuckleSection.ts#IAutoMovieHumanKnuckleSection.IMeasure

## @evidence contracts/development/common.md#meaningful-documentation

A section's two measures, mm.

## @evidence contracts/development/design.md#principled-representation `breadth`: Extent along the line from knuckle II to knuckle V. `girth`: Hull perimeter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanKnuckleSection.measure. Also types AutoMovieHumanHandSkinTargets.skin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `girth`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanKnuckleSection.ts#IAutoMovieHumanKnuckleSection.MeasureMcps

## @evidence contracts/development/common.md#meaningful-documentation

Measure a mesh's knuckle section.

## @evidence contracts/development/design.md#principled-representation

Measure a mesh's knuckle section. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanKnuckleSection.MeasureMcps is the canonical exchange used by AutoMovieHumanKnuckleSection.measure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanKnuckleSection.measure for measure a mesh's knuckle section.
