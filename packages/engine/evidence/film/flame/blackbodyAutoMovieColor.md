# src/film/flame/blackbodyAutoMovieColor.ts#blackbodyAutoMovieColor

## @evidence contracts/development/common.md#meaningful-documentation

States Planck's law, the colour-matching fit and its source, the sRGB matrix, the clamping, the normalization and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Integrates Planck's spectral radiance against the Wyman, Sloan and Shirley multi-lobe fit of the CIE 1931 2° functions at 1 nm over 360 to 830 nm, converts with the IEC 61966-2-1 matrix and scales the largest channel to one, since a light's colour is a chromaticity and its intensity is separate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper productions call to set a flame light's colour.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tabulated colour list; out-of-gamut negatives are clamped and stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

471 wavelength samples per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call evaluates one temperature.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new colour record.
