# src/drawing/IAutoMovieDrawingEdge.ts#IAutoMovieDrawingEdge

## @evidence contracts/development/design.md#principled-representation

An unordered pair of world points is the minimal record of a straight line segment before projection, which keeps extraction independent of any view's sheet coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One edge record shared by silhouette extraction, cut extraction and drafting, so the two extractors feed one projection path instead of each emitting sheet lines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries no role, element or view field, so no extractor can special-case one through the edge itself; degenerate edges are dropped by stated rules at extraction and drafting.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the units and frame, the producers and consumer, that direction is meaningless, and where degenerate edges are dropped.
