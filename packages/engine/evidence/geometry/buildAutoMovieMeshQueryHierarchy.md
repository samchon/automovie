# src/geometry/buildAutoMovieMeshQueryHierarchy.ts#buildAutoMovieMeshQueryHierarchy

## @evidence contracts/development/implementation.md#principled-implementation

A median-split bounding-volume hierarchy: node extrema are the componentwise union of entry boxes, so enclosure holds by construction whatever split is chosen, and the median keeps depth logarithmic in the entry count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The builder only partitions boxes; admitting entries, reading their geometry and walking the tree belong to the queries, which share this one builder and its `IAutoMovieMeshQueryHierarchy` node type.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box is padded and no entry is dropped or merged, and the leaf size only trades traversal cost; the infinite sentinels of an empty leaf are stated instead of being replaced by a fake box.

## @evidence contracts/development/common.md#meaningful-documentation

States the suppliers and frame, the enclosure guarantee, the in-place sort and the shared small-input array, the split and tie rules, what the leaf size changes, and the empty sentinels.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n entries each level sorts its span once, O(n log n) per level over O(log n) levels, so O(n log^2 n) time and O(n log n) transient allocation from the per-level slices; a selection-based median would save a log factor but would lose the stable tie order the queries' deterministic witnesses rely on.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compiled query or envelope; the tree is the reused artifact and is answered on its owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned tree, at most n/3 nodes for n above twelve with two three-number arrays each and leaf arrays of entry references; the per-level slices of internal nodes are garbage once their children are built.
