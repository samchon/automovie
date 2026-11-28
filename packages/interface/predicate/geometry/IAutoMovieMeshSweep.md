# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Sweep geometry, ring sampling policy and wall shading for a directly triangulated mesh.

## @evidence contracts/development/design.md#principled-representation

The mesher compiles each sampled section into canonical envelope and hole rings, joins equal sites, and triangulates its two end regions when capped.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These inputs describe sampling and closure independent of subdivision. The referenced sweep owns authored spine, stations and section correspondence.

# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed authored sweep in model metres. CompileSweep admits its authored geometry before the mesher samples it.

# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps.rows

## @evidence contracts/development/common.md#meaningful-documentation

At least two finite strictly increasing normalized spine coordinates, exactly 0 first and 1 last. Omission uses the spine points' chord-length shares.

# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps.columns

## @evidence contracts/development/common.md#meaningful-documentation

Samples per loop unless parameter correspondence supplies a polygon's corners. Supply a safe integer of at least three; the default is 32.

# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps.caps

## @evidence contracts/development/common.md#meaningful-documentation

Whether to close both ends by triangulating end regions and retaining their holes. Omission enables caps and false gives open walls.

# src/geometry/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps.shading

## @evidence contracts/development/common.md#meaningful-documentation

Wall normal policy. Flat shading duplicates triangle corners. Smooth shading shares ring vertices and pools normals across duplicated UV seam corners. Omission uses flat shading.
