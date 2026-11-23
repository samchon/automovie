# src/scene/IAutoMovieFog.ts#IAutoMovieFog

## @evidence contracts/development/design.md#principled-representation

The shared fog transmittance uses exp of negative squared density-times-camera-depth to match the viewer's FogExp2 shader, with inverse-meter density and zero as unit transmission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scene-wide density and linear target color describe the supported depth cue without per-region particle or volumetric simulation data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This squared-depth law is not physical Beer-Lambert extinction and treats opposite signed depths equally. Binary64 predictions do not prove exact GPU pixels, and structural guide passes suspend fog rather than tint their geometry projection.

## @evidence contracts/development/common.md#meaningful-documentation

Defines camera-axis depth, density units, transmittance and half-visibility formulas, zero state and linear color with unused alpha.
