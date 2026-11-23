# src/drawing/IAutoMovieOpeningNominalExtent.ts#IAutoMovieOpeningNominalExtent

## @evidence contracts/development/design.md#principled-representation

IResult carries a basis for two distinct metre-valued frames or null for unmeasurable geometry; dimension absence is not encoded as zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Drawing opening marks and schedule rows consume the same precedence and provenance result from autoMovieOpeningNominalExtent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fill substitute remains labelled as such, so a leaf's extent cannot silently become a hole measurement.

## @evidence contracts/development/common.md#meaningful-documentation

IResult documents profile precedence, null causes, basis-specific axes and rounding.

# src/drawing/IAutoMovieOpeningNominalExtent.ts#IAutoMovieOpeningNominalExtent.IResult

## @evidence contracts/development/design.md#principled-representation

The basis discriminant distinguishes face-local void hull spans from world-axis fill extents, both in metres. Null records absent measurable geometry instead of mixing absent and numeric dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Opening marks and schedule occurrences share this result so profile precedence and fill substitution are consistent; geometry sizing remains in the two specific extent producers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fallback is explicitly labelled fill and never called hole geometry; a null result becomes the consumer's none/unmeasured basis rather than zero size.

## @evidence contracts/development/common.md#meaningful-documentation

Defines basis-specific frames, metre units, precedence, all absence cases, rounding and result ownership.
