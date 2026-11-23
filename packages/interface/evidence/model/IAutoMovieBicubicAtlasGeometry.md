# src/model/IAutoMovieBicubicAtlasGeometry.ts#IAutoMovieBicubicAtlasGeometry

## @evidence contracts/development/design.md#principled-representation

Sixteen shared Bernstein coefficient indices define each tensor patch; a named identity domain keeps independent coincident sheets distinct.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One coefficient registry owns all patch boundaries and interiors, and explicit tessellation budgets belong to the recipe.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No original source vertices, triangle topology, normals or external mesh reference are accepted as generation data.

## @evidence contracts/development/common.md#meaningful-documentation

States metres, row order, shared-boundary identity, approximation scope and partial resource semantics.
