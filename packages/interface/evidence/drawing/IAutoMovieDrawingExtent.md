# src/drawing/IAutoMovieDrawingExtent.ts#IAutoMovieDrawingExtent

## @evidence contracts/development/design.md#principled-representation

autoMovieDrawingExtent folds the listed page points into per-axis minima and maxima. For finite points this is their axis-aligned hull, excluding stroke thickness and note glyphs; it does not guarantee that all SVG ink fits inside the sheet after scale, margin and pen application.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two corner points are the whole box; width and height are derived by the serializer when it needs them rather than stored twice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stale targets and unmeasured note glyphs are left out rather than padded with a guessed size, and the latter is declared as a drawing gap.

## @evidence contracts/development/common.md#meaningful-documentation

States the units, exactly which points the box covers and excludes, and how the serializer uses it.
