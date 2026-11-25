# src/human/generation/head/IAutoMovieHumanHeadMassSource.ts#IAutoMovieHumanHeadMassSource.IDensity

## @evidence contracts/development/common.md#meaningful-documentation

Existing public mass resolution, independent of anatomical dimensions.

## @evidence contracts/development/design.md#principled-representation `spacing`: Widest authored station interval in calibration millimetres. `order`: Existing periodic compatibility-row order. `samples`: Existing display ring population.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadMassSource.of, AutoMovieHumanHeadMassSource.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `spacing`, `order`, `samples`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadMassSource.ts#IAutoMovieHumanHeadMassSource.PrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Prepare the common axis, outlines and two lower named calipers once.

## @evidence contracts/development/design.md#principled-representation

Prepare the common axis, outlines and two lower named calipers once. The callable takes cranialTapePower (optional) and returns IAutoMovieViewPart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadMassSource.PrepareResult is the canonical exchange used by AutoMovieHumanHeadMassSource.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadMassSource.prepare for prepare the common axis, outlines and two lower named calipers once.
