# src/human/generation/leg/IAutoMovieHumanLegSection.ts#IAutoMovieHumanLegSection

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegSection exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISection, OfCentre, OfStrip, OfAnkle. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegSection; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISection, OfCentre, OfStrip, OfAnkle contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegSection.ts#IAutoMovieHumanLegSection.ISection

## @evidence contracts/development/common.md#meaningful-documentation

One station's section.

## @evidence contracts/development/design.md#principled-representation `frame`: The section plane. `local`: Points in the plane, `[x, z, lift]`, one per phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegSection.of. Also types AutoMovieHumanLegChain.section, AutoMovieHumanLegChain.here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `local`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegSection.ts#IAutoMovieHumanLegSection.OfCentre

## @evidence contracts/development/common.md#meaningful-documentation

The section at station s, canonical.

## @evidence contracts/development/design.md#principled-representation

The section at station s, canonical. The callable takes s and returns [number, number].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSection.OfCentre is the canonical exchange used by AutoMovieHumanLegSection.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.

# src/human/generation/leg/IAutoMovieHumanLegSection.ts#IAutoMovieHumanLegSection.OfStrip

## @evidence contracts/development/common.md#meaningful-documentation

The section at station s, canonical.

## @evidence contracts/development/design.md#principled-representation

The section at station s, canonical. The callable takes w and returns AutoMovieVector3Tuple[].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSection.OfStrip is the canonical exchange used by AutoMovieHumanLegSection.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.

# src/human/generation/leg/IAutoMovieHumanLegSection.ts#IAutoMovieHumanLegSection.OfAnkle

## @evidence contracts/development/common.md#meaningful-documentation

The section at station s, canonical.

## @evidence contracts/development/design.md#principled-representation

The section at station s, canonical. The callable takes w and returns AutoMovieVector3Tuple[].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSection.OfAnkle is the canonical exchange used by AutoMovieHumanLegSection.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.
