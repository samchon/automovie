# src/geometry/IAutoMovieMeshCrossing.ts#IAutoMovieMeshCrossing

## @evidence contracts/development/common.md#meaningful-documentation

A strict surface crossing witness addressed by both source triangle ordinals.

## @evidence contracts/development/design.md#principled-representation

The census keeps original ordinals through spatial indexing and distinguishes transverse piercing from admitted coplanar overlap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A witness carries only the pair and its classification. The caller retains the meshes needed to inspect those faces.

# src/geometry/IAutoMovieMeshCrossing.ts#IAutoMovieMeshCrossing.triangle

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based triangle ordinal in the first mesh's source order, before spatial indexing.

# src/geometry/IAutoMovieMeshCrossing.ts#IAutoMovieMeshCrossing.other

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based triangle ordinal of the second mesh witness, before target hierarchy reordering.

# src/geometry/IAutoMovieMeshCrossing.ts#IAutoMovieMeshCrossing.coplanar

## @evidence contracts/development/common.md#meaningful-documentation

True for an overlap admitted by the coplanar test. False for a transverse piercing witness.
