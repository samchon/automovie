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
