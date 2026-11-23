# src/geometry/IAutoMovieMeshTarget.ts#IAutoMovieMeshTarget

## @evidence contracts/development/design.md#principled-representation

Extends `ITessellation`'s three parallel flat arrays with a parallel UV array, the glTF attribute layout the mesh record itself uses, so the builder spreads the target into its result without reshaping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named shape for the buffers that `emptyMeshTarget` creates and `pushFlatTriangle` appends to, which each previously declared as its own private copy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

UVs are required rather than nullable, so a builder using this target cannot quietly omit its atlas.

## @evidence contracts/development/common.md#meaningful-documentation

States its creator, appender and fillers, the unit and frame of each array, and why UVs are always present.
