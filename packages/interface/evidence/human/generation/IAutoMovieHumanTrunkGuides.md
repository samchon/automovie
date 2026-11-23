# src/human/generation/IAutoMovieHumanTrunkGuides.ts#IAutoMovieHumanTrunkGuides.Guide

## @evidence contracts/development/common.md#meaningful-documentation

A guide of the canonical left side.

## @evidence contracts/development/design.md#principled-representation

A guide of the canonical left side. The closed alternatives are "frontMidline", "bustLine", "anteriorAxillary", "midAxillary", "posteriorAxillary", "scapular", "backMidline".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkGuides.jet. Also types AutoMovieHumanTrunkGuides.ORDER, AutoMovieHumanTrunkGuides.KNOT.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkGuides.ORDER, AutoMovieHumanTrunkGuides.KNOT, AutoMovieHumanTrunkGuides.jet, AutoMovieHumanTrunkGuides.sector for a guide of the canonical left side.

# src/human/generation/IAutoMovieHumanTrunkGuides.ts#IAutoMovieHumanTrunkGuides.ISector

## @evidence contracts/development/common.md#meaningful-documentation

A left sector: the quadrant it lies on, its two guides and whether the crotch fold acts on it.

## @evidence contracts/development/design.md#principled-representation `name`: The sector's name in findings. `side`: The quadrant the sector lies on. `guides`: Its first and second guide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkGuides.sector. Also types AutoMovieHumanTrunkGuides.SECTORS, AutoMovieHumanTrunkRing.SECTORS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `side`, `guides`, `folded`, `shares`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkGuides.ts#IAutoMovieHumanTrunkGuides.SectorSpeeds

## @evidence contracts/development/common.md#meaningful-documentation

A sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold.

## @evidence contracts/development/design.md#principled-representation

A sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkGuides.SectorSpeeds is the canonical exchange used by AutoMovieHumanTrunkGuides.sector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkGuides.sector for a sector of a section: its jet at a phase between its guides' knots, per radian (point, first and second derivatives), its guides' jets read once without the crotch fold.
