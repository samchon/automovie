# src/validation/validateMesh.ts#validateMesh

## @evidence contracts/development/implementation.md#principled-implementation

Walk IAutoMovieMesh's typed buffer containers for tuple/cardinality, dense finite numeric elements, vertex references, skin bindings and methods, morph target buffers, names and drivers, and shared welded topology; the array/null and skin-record container structure is a precondition rather than an unknown-payload schema check.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Attribute, skin and morph target checks stay with the mesh, applying the clip curve's point rules to drivers, while appendMeshTopology owns topology admission and analysis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Indexed walks inspect resident holes as undefined and malformed numeric coordinates cannot escape through weld analysis. Malformed containers such as positions:null can still throw at length access; skin normalization uses a 1e-6 tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

States the typed-container premise, one/two/three/four component arities, located numeric/cardinality errors and the separate welded-topology responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Total buffer size, including morph target deltas, drives linear admission; welded topology adds its edge/triangle costs and per-vertex four-weight checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Common tuple/length helpers serve attributes, and the canonical topology owner prevents independent welded rules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only collector rows remain; local joint and target-name sets and weight slices release and no mesh renderer or byte decoder is created.
