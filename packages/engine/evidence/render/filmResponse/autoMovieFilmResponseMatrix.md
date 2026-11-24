# src/render/filmResponse/autoMovieFilmResponseMatrix.ts#autoMovieFilmResponseMatrix

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment states the input units and frames, the cited method, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The exposure scale is the ISO 12232:2019 saturation-based mapping with the 1.2 factor; the white balance is complete von Kries adaptation in the CAT02 cone space of CIE 159:2004 from the Planckian white to the IEC 61966-2-1 D65 white, between linear Rec. 709 and XYZ. Both whites have unit luminance, so a neutral keeps its luminance. All three steps are linear, so one matrix serves the scene value and its glare.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the exposure and the adaptation in one closed form; the Planckian chromaticity and the Rec. 709 matrices stay with their own owners, and the 3 × 3 helpers are private to this composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every coefficient is a cited standard value; nothing is fitted or tuned to a test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: a handful of 3 × 3 products and one adjugate inverse per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computed per call; the stage calls it once per draw with optics, which is negligible against the frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few small arrays per call and retains nothing.
