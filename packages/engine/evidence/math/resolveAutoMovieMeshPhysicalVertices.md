# src/math/resolveAutoMovieMeshPhysicalVertices.ts#resolveAutoMovieMeshPhysicalVertices

## @evidence contracts/development/implementation.md#principled-implementation

Explicit domain/id pairs and legacy grid cells use separate first-occurrence interning spaces; every explicit alias must agree on the same nanometre coordinate grid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The identity owner reuses position welding and supplies labels/ordinals to topology, deformation, merge and partition matching.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed metadata and separated aliases throw; only omitted correspondence selects legacy welding rather than silently ignoring a declaration.

## @evidence contracts/development/common.md#meaningful-documentation

Documents key separation, dense numbering, finite positions, source-reference admission, alias agreement and geometry properties identity alone cannot establish.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and S source rows, key construction, welding and interning use O(V plus S) expected map work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One weld table supplies all alias-cell comparisons, and each source key is constructed once for all its render references.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Interning maps are released on return; caller-owned labels and ordinals are bounded by source/render populations and retain no source-buffer reference.
