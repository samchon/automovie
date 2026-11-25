# src/drawing/IAutoMovieDrawingToSvg.ts#IAutoMovieDrawingToSvg.IProps

## @evidence contracts/development/design.md#principled-representation

A derived drawing and its originating view join model-metre geometry to page-millimetre pen and scale settings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieDrawingToSvg reads the existing drawing and view; no canvas, renderer or filesystem handle enters serialization.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mismatched view identity and invalid positive pen scalars throw; missing drawing evidence stays in SVG markers rather than disappearing.

## @evidence contracts/development/common.md#meaningful-documentation

Documents scale conversion, y inversion, XML escaping, deterministic bytes and refusal.
