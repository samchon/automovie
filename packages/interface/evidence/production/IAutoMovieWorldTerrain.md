# src/production/IAutoMovieWorldTerrain.ts#IAutoMovieWorldTerrain.IInput

## @evidence contracts/development/design.md#principled-representation

The polygon is in world XZ metres and height is constant world Y metres; worldTerrain constructs the surface without validating identity, geometry or finiteness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

worldTerrain lowers these inputs directly to IAutoMovieWorldSurface with a cloned footprint and constant height rule; downstream world validation owns admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

walkable remains an explicit authored permission. Empty or malformed polygons are preserved for validation rather than repaired into a different footprint.

## @evidence contracts/development/common.md#meaningful-documentation

Authored footprint and constant world height for flat terrain construction. The polygon is in world XZ metres and height is constant world Y metres; worldTerrain constructs the surface without validating identity, geometry or finiteness.
