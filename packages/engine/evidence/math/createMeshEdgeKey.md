# src/math/createMeshEdgeKey.ts#createMeshEdgeKey

## @evidence contracts/development/implementation.md#principled-implementation

Admitted integer pairs have injective base-population encoding while the squared population is safe; larger populations use delimited integers without losing endpoint bits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The factory owns pair encoding while consumers own directed ordering, welding and edge incidence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The binary64 safe-integer boundary alone selects representation; large meshes are not refused to preserve numeric keys.

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint admission, ordered identity, safe numeric bound, string fallback and undirected ordering responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission and each key use constant scalar work; the closure avoids checking population safety for every edge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One closure fixes representation throughout the traversal, preventing equivalent edges from mixing numeric and string keys.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains only vertexCount; numeric keys allocate no object and string keys belong to consuming incidence maps.
