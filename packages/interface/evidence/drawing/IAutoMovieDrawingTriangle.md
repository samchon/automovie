# src/drawing/IAutoMovieDrawingTriangle.ts#IAutoMovieDrawingTriangle

## @evidence contracts/development/design.md#principled-representation

Three ordered corners are the standard oriented-triangle record, and the right-hand cross product of its edges is the usual face normal, so facing needs no stored normal that could disagree with the corners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One triangle record shared by element and shell triangulation, clipping, transformation, silhouette and cut extraction, and feature resolution, so the whole drawing pipeline passes geometry in one shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries no element, part or role field a stage could special-case; orientation comes from the corners alone.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the units and the one model-frame producer, the winding and normal convention, which stages depend on winding and which preserve or ignore it, and that face indices follow emission order.
