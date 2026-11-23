# src/drawing/AutoMovieDrawingFeatureKind.ts#AutoMovieDrawingFeatureKind

## @evidence contracts/development/design.md#principled-representation

The resolver uses current-state element matrices and static CPU part tessellation, without skinning, attached-bone placement or GPU deformation. Vertices and edges sort by six-decimal world keys but retain the last emitted unrounded representative per key; faces keep emission order, axis direction is transformed tip minus origin, and centroid averages the welded representatives. These are binary64 constructions, not persistent topology identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five families cover the points a drafter pins to, and each resolves to one point plus an optional direction, so dimensions and notes share a single resolver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The vertex mean is named as such instead of being presented as a true centroid, and no family falls back to another when its index is out of range.

## @evidence contracts/development/common.md#meaningful-documentation

States the world point each family resolves to, the welding precision, which families carry a direction, and how the centroid differs from an area or volume centroid.
