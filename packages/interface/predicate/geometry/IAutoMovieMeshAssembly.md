# src/geometry/IAutoMovieMeshAssembly.ts#IAutoMovieMeshAssembly

## @evidence contracts/development/common.md#meaningful-documentation

Fresh rigid mesh buffers and a parallel list of member ranges after placement and concatenation.

## @evidence contracts/development/design.md#principled-representation

The merge rebases vertex indices and packs each member's triangle indices in declaration order. It preserves contributing triangles from overlaps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ranges track member ownership after concatenation. Material definitions, selections and transforms live outside the result.

# src/geometry/IAutoMovieMeshAssembly.ts#IAutoMovieMeshAssembly.mesh

## @evidence contracts/development/common.md#meaningful-documentation

Owned merged buffers, with explicit triangle indices and no skin. UVs and normals survive when every contributing mesh carries the corresponding attribute.

# src/geometry/IAutoMovieMeshAssembly.ts#IAutoMovieMeshAssembly.groups

## @evidence contracts/development/common.md#meaningful-documentation

One range for each declared member, in declaration order. Empty members can have zero-length ranges at the current index offset.
