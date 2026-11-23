# src/human/generation/IAutoMovieHumanKnuckleSection.ts#IAutoMovieHumanKnuckleSection

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanKnuckleSection exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IMeasure, MeasureMcps. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanKnuckleSection; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IMeasure, MeasureMcps contracts and adds no alternate implementation, optional mode or runtime state.

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
