# src/human/generation/leg/IAutoMovieHumanLegSectionLaw.ts#IAutoMovieHumanLegSectionLaw.ILaw

## @evidence contracts/development/common.md#meaningful-documentation

One leg's law.

## @evidence contracts/development/design.md#principled-representation `bottom`: Station of the ankle ring, mm. `top`: Station of the crotch ring, mm. `ankleWorld`: The ankle ring, canonical world.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegSectionLaw.of. Read by AutoMovieHumanLegSection.of, AutoMovieHumanLegSectionLaw.points. Also types AutoMovieHumanLegChain.law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bottom`, `top`, `ankleWorld`, `ankleCentre`, `crotchCentre`, `ankleReach`, `crotchReach`, `girth`, `tube`, `root`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegSectionLaw.ts#IAutoMovieHumanLegSectionLaw.PointsCentre

## @evidence contracts/development/common.md#meaningful-documentation

World points of the law's section at a station, canonical, at the leg's phases.

## @evidence contracts/development/design.md#principled-representation

World points of the law's section at a station, canonical, at the leg's phases. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegSectionLaw.PointsCentre is the canonical exchange used by AutoMovieHumanLegSectionLaw.points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSectionLaw.points for world points of the law's section at a station, canonical, at the leg's phases.
