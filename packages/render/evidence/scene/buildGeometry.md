# src/index.ts#buildGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Uses engine tessellation for primitives and realizes admitted raw position/normal/UV/color/relief/skin arrays as native typed attributes and morph targets as named relative morph attributes (zero normal deltas where a target has none but another does, as Three requires), computing normals only when absent and preserving physical-vertex identity through its owner helper; widths/index bounds and Float32/Uint16 representability are source premises, so numeric narrowing can differ from engine double precision.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one Three buffer realization, leaving primitive topology to tessellate, texture semantics to material builders and simulation/render vertex correspondence to AutoMovieGeometryPhysicalVertices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Writes the actual artifact arrays without geometry-id exceptions, copied UV channels or generated placeholder primitives; missing normals use native computation, not fixture normal values.

## @evidence contracts/development/common.md#meaningful-documentation

Describes primitive/raw realization and immediate geometry ownership/rollback; attribute comments identify the one admitted UV set and the physical/render correspondence helper supplies its own contract.

## @evidence contracts/development/implementation.md#efficient-algorithms

CPU allocation/copy grows with emitted vertices/indices, supplied attribute channels and morph targets (one or two Float32 copies of 3V per target), with one geometry and no redundant UV sets; missing-normal computation visits triangles, while engine primitive tessellation dominates its own shape population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses canonical engine tessellation and physical-vertex mapping code; each mutable geometry belongs to an independent model owner and no immutable topology/revision key permits cross-build sharing here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Registers the new BufferGeometry before attribute/tessellation work, transfers it only after full initialization and independently retires it on refusal; typed attributes remain bounded by the admitted mesh, and this producer owns no material, renderer or task.
