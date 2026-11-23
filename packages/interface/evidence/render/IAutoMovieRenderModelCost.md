# src/render/IAutoMovieRenderModelCost.ts#IAutoMovieRenderModelCost

## @evidence contracts/development/design.md#principled-representation

Model measurement counts drawable parts, tessellated vertex/triangle populations and distinct cited materials, estimating vertex-attribute and index device storage from the compiled geometry representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A reusable per-model row avoids charging shared geometry storage once per scene placement, while the inventory separately counts submitted instances and whole-frame passes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Geometry bytes are estimates rather than observed GPU allocation, and one part's submission count does not include extra shadow or guide passes by itself.

## @evidence contracts/development/common.md#meaningful-documentation

Defines runtime id, nullable direct-placement tier, parts, vertices, triangles, materials and estimated storage units.
