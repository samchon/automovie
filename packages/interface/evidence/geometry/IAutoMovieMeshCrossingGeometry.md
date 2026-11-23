# src/geometry/IAutoMovieMeshCrossingGeometry.ts#IAutoMovieMeshCrossingGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Original triangle ordinals and copied metre corners share one query snapshot frame and exact enclosing hierarchy. Degenerate triangles retain their original ordinal; absent hierarchy denotes an empty index run rather than failed geometry.

## @evidence contracts/development/design.md#principled-representation

Original triangle ordinals and copied metre corners share one query snapshot frame and exact enclosing hierarchy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMeshCrossingGeometry constructs the snapshots consumed by crossing queries; canonical mesh and hierarchy contracts remain imported.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate triangles retain their original ordinal; absent hierarchy denotes an empty index run rather than failed geometry.

# src/geometry/IAutoMovieMeshCrossingGeometry.ts#IAutoMovieMeshCrossingGeometry.ITriangle

## @evidence contracts/development/design.md#principled-representation

Actual corners, component extrema and original ordinal supply the existing strict narrow phase and exact-box candidate walker without substituting a shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the shared spatial entry with only its three XYZ corners; no second mesh or collision representation is introduced.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Area does not determine membership: every admitted source triple receives a record and keeps its ordinal.

## @evidence contracts/development/common.md#meaningful-documentation

States original identity, current-snapshot geometry and degenerate membership; the inherited spatial entry defines box and partition-centre units.

# src/geometry/IAutoMovieMeshCrossingGeometry.ts#IAutoMovieMeshCrossingGeometry.ISnapshot

## @evidence contracts/development/design.md#principled-representation

Copied fixed indices preserve original triangle identity while current independent corners and hierarchy bounds represent exactly one pose; empty index populations have no hierarchy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stores the layout cardinality, index run, original-order triangles and current tree needed by initial or refitted query construction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No previous mutable mesh, transform key or omitted active population is stored; degenerate source triples remain in triangles and tree.

## @evidence contracts/development/common.md#meaningful-documentation

Documents scalar cardinality including unused vertices, shared frozen indices, original-order records and undefined hierarchy semantics.
