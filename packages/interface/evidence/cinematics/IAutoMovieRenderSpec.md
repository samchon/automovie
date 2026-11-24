# src/cinematics/IAutoMovieRenderSpec.ts#IAutoMovieRenderSpec

## @evidence contracts/development/design.md#principled-representation `frameTimes` computes each sample as `i / fps` rather than by accumulation so no rounding drift builds up, `ffmpegArgs` passes the codec, pixel format, CRF, rate and size verbatim with the BT.709 full-range conversion and sRGB tags the delivery profile declares, and `autoMovieRenderTargetSettingsOfShot` resolves the curve as the scene environment's `toneMapping` when present, else this spec's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The spec holds only delivery choices (target, clock and raster, curve default, encoder settings) and never content, and `codec` and `pixelFormat` are single-member unions because one encoder path exists and a wider option would promise output nothing produces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Structural passes bypass tone mapping as a rule rather than per scene, and the curve is never forced onto a scene that declares its own; the remaining gap is that `crf` reaches the encoder unchecked, which its documentation states.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame count and sample formula, the exact encoder arguments, which layer owns the tone curve and when this default applies, that structural passes ignore it, and that the caller must keep the CRF in range.
