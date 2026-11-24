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

For n entries each level sorts its span once, O(n log n) per level over O(log n) levels, so O(n log^2 n) time and O(n log n) transient allocation from the per-level slices. Consumers that depend on stable centre ties use this entry point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compiled query or envelope; the tree is the reused artifact and is answered on its owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned tree, at most n/3 nodes for n above twelve with two three-number arrays each and leaf arrays of entry references; the per-level slices of internal nodes are garbage once their children are built.

# src/geometry/buildAutoMovieMeshQueryHierarchy.ts#buildAutoMovieMeshQueryHierarchy.partition

## @evidence contracts/development/common.md#meaningful-documentation

Identifies finite world boxes, scratch array ownership, median rank, exact descendant bounds and the crossing query as the consumer that supplies its own candidate order.

## @evidence contracts/development/implementation.md#principled-implementation

The equal-count split preserves bounded depth. Three-way selection partitions entries around the median rank, including equal centres. Box unions and the widest-axis choice use the same operations as the stable builder. The split follows the equal-count BVH construction in [Physically Based Rendering](https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bounds, axis choice and rank selection are separate operations. A single range walk gives each child half the entries and copies only leaf spans in the usual path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every entry and exact bound survives. Equal centre placement can vary because the crossing owner independently orders candidates by shared cell and original triangle ordinal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Median selection does linear work per level when it stays within two span lengths, the sum of an ideal halving sequence. A local sort bounds selection work on an adverse pivot sequence. The usual build is O(n log n), with O(n log² n) worst-case time when the fallback recurs. On the same saved 571,024-triangle neutral skin, crossing-query preparation was 11.24 s in both original trials and 4.62–5.40 s in three partition trials. Preparation and traversal together ranged from 26.37–27.70 s before to 18.92–22.20 s after. The four directed witnesses kept their original order.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The partition is built from the caller's admitted triangle positions. Current-position refits reuse the caller-owned hierarchy's partition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps one caller scratch array during construction, shares it across the recursive ranges and returns O(n) nodes and leaf entry references. The sort fallback uses temporary storage only for its active range.
