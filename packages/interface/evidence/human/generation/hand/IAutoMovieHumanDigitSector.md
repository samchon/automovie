# src/human/generation/hand/IAutoMovieHumanDigitSector.ts#IAutoMovieHumanDigitSector.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

A guide's jet at a section's phase, in the section's `[across, palmar]` plane.

## @evidence contracts/development/design.md#principled-representation `point`: Point, mm. `tangent`: Unit tangent in the direction of increasing phase. `curvature`: Curvature vector `kappa N`, toward the section's inside, 1/mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitSector.of. Also types AutoMovieHumanDigitRing.guides.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `tangent`, `curvature`, `speed`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitSector.ts#IAutoMovieHumanDigitSector.OfResult

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate a section-sector jet at absolute phase t in radians. The result carries position and first/second phase derivatives in the section's [across, palmar] chart.

## @evidence contracts/development/design.md#principled-representation

Evaluate a section-sector jet at absolute phase t in radians. The result carries position and first/second phase derivatives in the section's [across, palmar] chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitSector.OfResult is the canonical exchange used by AutoMovieHumanDigitSector.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanDigitSector input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
