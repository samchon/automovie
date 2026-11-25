# src/human/generation/IAutoMovieHumanDigitSection.ts#IAutoMovieHumanDigitSection.IShape

## @evidence contracts/development/common.md#meaningful-documentation

A section's shape, millimetres and normalised constants.

## @evidence contracts/development/design.md#principled-representation `width`: Half width across the digit, from the bone to either side point. `palmar`: Depth of the palmar half from the bone to its apex. `dorsal`: Depth of the dorsal half from the bone to its apex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitProfile.of, AutoMovieHumanDigitSpan.shape. Read by AutoMovieHumanDigitSection.controls, AutoMovieHumanDigitSection.knots, AutoMovieHumanDigitSection.girth. Also types AutoMovieHumanDigitProfile.shape, AutoMovieHumanHandDigitBones.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `width`, `palmar`, `dorsal`, `side`, `palmarApex`, `dorsalApex`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanDigitSection.ts#IAutoMovieHumanDigitSection.ControlsResult

## @evidence contracts/development/common.md#meaningful-documentation

Ordered planar [b, n] control points in millimetres, sampled at phases 2*pi*m/count from the radial side toward the palm. These are spline controls, not on-curve samples.

## @evidence contracts/development/design.md#principled-representation

Ordered planar [b, n] control points in millimetres, sampled at phases 2*pi*m/count from the radial side toward the palm. These are spline controls, not on-curve samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitSection.ControlsResult is the canonical exchange used by AutoMovieHumanDigitSection.controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanDigitSection input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/IAutoMovieHumanDigitSection.ts#IAutoMovieHumanDigitSection.KnotsResult

## @evidence contracts/development/common.md#meaningful-documentation

On-curve planar [b, n] knot samples in millimetres from the same uniform cubic B-spline. Their uniform phases match the section controls so an interpolating consumer preserves the guide jets.

## @evidence contracts/development/design.md#principled-representation

On-curve planar [b, n] knot samples in millimetres from the same uniform cubic B-spline. Their uniform phases match the section controls so an interpolating consumer preserves the guide jets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitSection.KnotsResult is the canonical exchange used by AutoMovieHumanDigitSection.knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanDigitSection input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
