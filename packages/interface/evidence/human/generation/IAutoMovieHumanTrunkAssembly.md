# src/human/generation/IAutoMovieHumanTrunkAssembly.ts#IAutoMovieHumanTrunkAssembly.Sector

## @evidence contracts/development/common.md#meaningful-documentation

A sector's jet at a phase: point, first and second derivatives per radian.

## @evidence contracts/development/design.md#principled-representation

A sector's jet at a phase: point, first and second derivatives per radian. The callable takes t and returns [number[], number[], number[]].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmRootArc.sector, AutoMovieHumanTrunkAssembly.mirror, AutoMovieHumanTrunkGuides.sector. Read by AutoMovieHumanTrunkAssembly.controls, AutoMovieHumanTrunkAssembly.mirror. Also types AutoMovieHumanTrunkRing.sectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmRootArc.create, AutoMovieHumanArmRootArc.sector, AutoMovieHumanTrunkAssembly.controls, AutoMovieHumanTrunkAssembly.mirror for a sector's jet at a phase: point, first and second derivatives per radian.

# src/human/generation/IAutoMovieHumanTrunkAssembly.ts#IAutoMovieHumanTrunkAssembly.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

A guide of the left side.

## @evidence contracts/development/design.md#principled-representation `knot`: Knot of the 256-control section. `jet`: The guide's jet in the section plane `[x, z]`, by arclength. `speed`: Parameter speed at the guide, mm per radian of phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkAssembly.controls. Also types AutoMovieHumanTrunkRing.guides.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `knot`, `jet`, `speed`; callers supply the complete record.
