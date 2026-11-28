# src/geometry/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.cage

## @evidence contracts/development/common.md#meaningful-documentation

The property states that this tier publishes a metre-valued quad control cage with indexed face-varying UVs.

# src/geometry/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.ICage

## @evidence contracts/development/common.md#meaningful-documentation

The record combines packed quad controls and the subdivision contract's required face-varying UV arrays.

## @evidence contracts/development/design.md#principled-representation

The network produces model-metre controls and copies its face, UV and UV-face topology from the same patch layout, preserving face-corner alignment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output reuses the subdivision cage's optional UV field definitions as required fields. The tier-specific controls supply only positions and quads.

# src/geometry/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.ICageControls

## @evidence contracts/development/common.md#meaningful-documentation

The record states packed control metres and outward quad winding.

## @evidence contracts/development/design.md#principled-representation

The network writes rest control coordinates and the face indices emitted by layout. UV indices address those same face corners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Controls own coordinates and face connectivity. The subdivision cage contract remains the owner of UV indexing.

# src/geometry/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.ICageControls.positions

## @evidence contracts/development/common.md#meaningful-documentation

The packed control coordinates are in metres and aligned to vertex ordinals.

# src/geometry/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.ICageControls.faces

## @evidence contracts/development/common.md#meaningful-documentation

Each face carries four vertex indices with outward counterclockwise winding.
