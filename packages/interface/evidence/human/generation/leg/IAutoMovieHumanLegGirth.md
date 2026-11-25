# src/human/generation/leg/IAutoMovieHumanLegGirth.ts#IAutoMovieHumanLegGirth.ITapes

## @evidence contracts/development/common.md#meaningful-documentation

The tapes the law reads, mm.

## @evidence contracts/development/design.md#principled-representation `thigh`: Thigh girth. `knee`: Knee girth at mid-patella. `calf`: Calf girth at its maximum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegGirth.tapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `thigh`, `knee`, `calf`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegGirth.ts#IAutoMovieHumanLegGirth.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the law is placed from.

## @evidence contracts/development/design.md#principled-representation `tapes`: The tapes. `bones`: The joints' heights, mm. `scale`: Calibration millimetres per world millimetre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegGirth.tapeStation, AutoMovieHumanLegGirth.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `ends`: The neighbours' rings, each a knot at its own station with its taut girth, `[girth]`. `site`: The thigh tape's station, mm: the person's gluteal furrow height, since ISO 8559-1 5.3.20 takes the thigh girth just below the gluteal fold.

# src/human/generation/leg/IAutoMovieHumanLegGirth.ts#IAutoMovieHumanLegGirth.RatioAtTable

## @evidence contracts/development/common.md#meaningful-documentation

Readonly [station share, ratio] rows in increasing share order; both components are dimensionless. The reader interpolates linearly between rows and holds the endpoint ratios outside them.

## @evidence contracts/development/design.md#principled-representation

Readonly [station share, ratio] rows in increasing share order; both components are dimensionless. The reader interpolates linearly between rows and holds the endpoint ratios outside them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegGirth.RatioAtTable is the canonical exchange used by AutoMovieHumanLegGirth.ratioAt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLegGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/leg/IAutoMovieHumanLegGirth.ts#IAutoMovieHumanLegGirth.OfResult

## @evidence contracts/development/common.md#meaningful-documentation

Requested section girth in millimetres at physical station s in millimetres. The produced law holds its endpoint values beyond the first and last knots.

## @evidence contracts/development/design.md#principled-representation

Requested section girth in millimetres at physical station s in millimetres. The produced law holds its endpoint values beyond the first and last knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegGirth.OfResult is the canonical exchange used by AutoMovieHumanLegGirth.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLegGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
